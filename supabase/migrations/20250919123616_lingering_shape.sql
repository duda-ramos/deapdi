/*
  # Complete Action Groups Backend

  1. Enhanced Tables
    - Add progress tracking to action_groups
    - Add PDI integration fields
    - Add completion tracking

  2. New Functions
    - calculate_group_progress: Calculate completion percentage
    - update_group_progress: Update progress when tasks change
    - complete_group: Mark group as completed and update linked PDI

  3. Triggers
    - Auto-update group progress when tasks change
    - Auto-complete group when all tasks done
    - Update linked PDI when group completes

  4. Policies
    - Enhanced permissions for group management
    - Task assignment permissions
*/

-- Add progress tracking columns to action_groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_groups' AND column_name = 'progress'
  ) THEN
    ALTER TABLE action_groups ADD COLUMN progress numeric DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_groups' AND column_name = 'linked_pdi_id'
  ) THEN
    ALTER TABLE action_groups ADD COLUMN linked_pdi_id uuid REFERENCES pdis(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_groups' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE action_groups ADD COLUMN completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_groups' AND column_name = 'total_tasks'
  ) THEN
    ALTER TABLE action_groups ADD COLUMN total_tasks integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_groups' AND column_name = 'completed_tasks'
  ) THEN
    ALTER TABLE action_groups ADD COLUMN completed_tasks integer DEFAULT 0;
  END IF;
END $$;

-- Function to calculate group progress
CREATE OR REPLACE FUNCTION calculate_group_progress(group_id uuid)
RETURNS numeric AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  progress_percentage numeric;
BEGIN
  -- Count total tasks for the group
  SELECT COUNT(*) INTO total_tasks
  FROM tasks
  WHERE tasks.group_id = calculate_group_progress.group_id;

  -- Count completed tasks
  SELECT COUNT(*) INTO completed_tasks
  FROM tasks
  WHERE tasks.group_id = calculate_group_progress.group_id
    AND status = 'done';

  -- Calculate percentage
  IF total_tasks = 0 THEN
    progress_percentage := 0;
  ELSE
    progress_percentage := (completed_tasks::numeric / total_tasks::numeric) * 100;
  END IF;

  RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to update group progress
CREATE OR REPLACE FUNCTION update_group_progress()
RETURNS trigger AS $$
DECLARE
  group_progress numeric;
  total_count integer;
  completed_count integer;
BEGIN
  -- Get the group_id from either NEW or OLD record
  DECLARE
    target_group_id uuid;
  BEGIN
    IF TG_OP = 'DELETE' THEN
      target_group_id := OLD.group_id;
    ELSE
      target_group_id := NEW.group_id;
    END IF;

    -- Skip if no group_id
    IF target_group_id IS NULL THEN
      RETURN COALESCE(NEW, OLD);
    END IF;

    -- Calculate current progress
    SELECT calculate_group_progress(target_group_id) INTO group_progress;

    -- Get task counts
    SELECT COUNT(*) INTO total_count
    FROM tasks
    WHERE group_id = target_group_id;

    SELECT COUNT(*) INTO completed_count
    FROM tasks
    WHERE group_id = target_group_id AND status = 'done';

    -- Update the group with new progress
    UPDATE action_groups
    SET 
      progress = group_progress,
      total_tasks = total_count,
      completed_tasks = completed_count,
      updated_at = now()
    WHERE id = target_group_id;

    -- Auto-complete group if all tasks are done and group is active
    IF group_progress = 100 THEN
      UPDATE action_groups
      SET 
        status = 'completed',
        completed_at = now()
      WHERE id = target_group_id AND status = 'active';

      -- Update linked PDI if exists
      UPDATE pdis
      SET 
        status = 'completed',
        updated_at = now()
      WHERE id = (
        SELECT linked_pdi_id 
        FROM action_groups 
        WHERE id = target_group_id
      ) AND status = 'in-progress';
    END IF;

    RETURN COALESCE(NEW, OLD);
  END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for group progress updates
DROP TRIGGER IF EXISTS update_group_progress_on_task_change ON tasks;
CREATE TRIGGER update_group_progress_on_task_change
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_group_progress();

-- Function to complete a group manually
CREATE OR REPLACE FUNCTION complete_action_group(group_id uuid)
RETURNS json AS $$
DECLARE
  group_record action_groups%ROWTYPE;
  result json;
BEGIN
  -- Get the group
  SELECT * INTO group_record
  FROM action_groups
  WHERE id = group_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Group not found');
  END IF;

  -- Update group status
  UPDATE action_groups
  SET 
    status = 'completed',
    completed_at = now(),
    progress = 100,
    updated_at = now()
  WHERE id = group_id;

  -- Update linked PDI if exists
  IF group_record.linked_pdi_id IS NOT NULL THEN
    UPDATE pdis
    SET 
      status = 'completed',
      updated_at = now()
    WHERE id = group_record.linked_pdi_id;
  END IF;

  -- Create notification for group creator
  INSERT INTO notifications (profile_id, title, message, type, action_url)
  VALUES (
    group_record.created_by,
    'Grupo de Ação Concluído',
    'O grupo "' || group_record.title || '" foi marcado como concluído!',
    'success',
    '/groups'
  );

  -- Notify all participants
  INSERT INTO notifications (profile_id, title, message, type, action_url)
  SELECT 
    agp.profile_id,
    'Grupo de Ação Concluído',
    'O grupo "' || group_record.title || '" foi concluído com sucesso!',
    'success',
    '/groups'
  FROM action_group_participants agp
  WHERE agp.group_id = group_id
    AND agp.profile_id != group_record.created_by;

  RETURN json_build_object('success', true, 'group_id', group_id);
END;
$$ LANGUAGE plpgsql;

-- Enhanced policies for action groups
DROP POLICY IF EXISTS "Enhanced group management" ON action_groups;
CREATE POLICY "Enhanced group management"
  ON action_groups
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('manager', 'hr', 'admin')
    ) OR
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE group_id = action_groups.id 
      AND profile_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('manager', 'hr', 'admin')
    )
  );

-- Enhanced policies for tasks
DROP POLICY IF EXISTS "Enhanced task management" ON tasks;
CREATE POLICY "Enhanced task management"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM action_groups ag
      WHERE ag.id = tasks.group_id 
      AND ag.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM action_group_participants agp
      WHERE agp.group_id = tasks.group_id 
      AND agp.profile_id = auth.uid()
      AND agp.role = 'leader'
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('manager', 'hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM action_groups ag
      WHERE ag.id = tasks.group_id 
      AND ag.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM action_group_participants agp
      WHERE agp.group_id = tasks.group_id 
      AND agp.profile_id = auth.uid()
      AND agp.role = 'leader'
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('manager', 'hr', 'admin')
    )
  );

-- Function to get group member contributions
CREATE OR REPLACE FUNCTION get_group_member_contributions(group_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'profile_id', p.id,
      'name', p.name,
      'avatar_url', p.avatar_url,
      'role', agp.role,
      'total_tasks', COALESCE(task_stats.total, 0),
      'completed_tasks', COALESCE(task_stats.completed, 0),
      'completion_rate', CASE 
        WHEN COALESCE(task_stats.total, 0) = 0 THEN 0
        ELSE (COALESCE(task_stats.completed, 0)::numeric / task_stats.total::numeric) * 100
      END
    )
  ) INTO result
  FROM action_group_participants agp
  JOIN profiles p ON p.id = agp.profile_id
  LEFT JOIN (
    SELECT 
      assignee_id,
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'done' THEN 1 END) as completed
    FROM tasks
    WHERE group_id = get_group_member_contributions.group_id
    GROUP BY assignee_id
  ) task_stats ON task_stats.assignee_id = p.id
  WHERE agp.group_id = get_group_member_contributions.group_id;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Update existing groups to have initial progress
UPDATE action_groups 
SET 
  progress = calculate_group_progress(id),
  total_tasks = (SELECT COUNT(*) FROM tasks WHERE group_id = action_groups.id),
  completed_tasks = (SELECT COUNT(*) FROM tasks WHERE group_id = action_groups.id AND status = 'done')
WHERE progress IS NULL;