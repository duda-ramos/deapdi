/*
  # Fix Ambiguous Column Reference in update_group_progress()
  
  ## Problem
  The function was using ambiguous variable names that conflicted with table column names:
  - `total_tasks = total_tasks` (ambiguous - could be variable or column)
  - `completed_tasks = completed_tasks` (ambiguous - could be variable or column)
  
  ## Solution
  Use prefixed variable names to avoid ambiguity:
  - `v_total_tasks` for the variable
  - `v_completed_tasks` for the variable
  - Explicitly qualify table columns where needed
  
  This fixes the PostgreSQL error:
  ERROR: 42702: column reference "total_tasks" is ambiguous
  DETAIL: It could refer to either a PL/pgSQL variable or a table column.
*/

-- Recreate the function with properly qualified variable names
CREATE OR REPLACE FUNCTION update_group_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  group_id_to_update uuid;
  v_total_tasks integer;
  v_completed_tasks integer;
  v_progress_percentage numeric;
BEGIN
  -- Determine which group to update
  IF TG_OP = 'DELETE' THEN
    group_id_to_update := OLD.group_id;
  ELSE
    group_id_to_update := NEW.group_id;
  END IF;
  
  -- Skip if not a group task
  IF group_id_to_update IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Count total and completed tasks for the group
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'done')
  INTO v_total_tasks, v_completed_tasks
  FROM tasks
  WHERE group_id = group_id_to_update;
  
  -- Calculate progress percentage
  IF v_total_tasks > 0 THEN
    v_progress_percentage := (v_completed_tasks::numeric / v_total_tasks) * 100;
  ELSE
    v_progress_percentage := 0;
  END IF;
  
  -- Update action group with explicitly qualified column references
  UPDATE action_groups
  SET 
    progress = v_progress_percentage,
    total_tasks = v_total_tasks,
    completed_tasks = v_completed_tasks,
    completed_at = CASE 
      WHEN v_progress_percentage = 100 AND action_groups.completed_at IS NULL THEN now()
      ELSE action_groups.completed_at
    END,
    status = CASE 
      WHEN v_progress_percentage = 100 AND action_groups.status = 'active' THEN 'completed'
      ELSE action_groups.status
    END
  WHERE id = group_id_to_update;
  
  -- If group is completed, notify participants
  IF v_progress_percentage = 100 THEN
    INSERT INTO notifications (profile_id, title, message, type, category, related_id)
    SELECT 
      agp.profile_id,
      '🎉 Grupo de Ação Concluído!',
      'O grupo "' || ag.title || '" foi concluído com sucesso!',
      'success',
      'group_completed',
      ag.id::text
    FROM action_groups ag
    JOIN action_group_participants agp ON agp.group_id = ag.id
    WHERE ag.id = group_id_to_update;
    
    -- Award bonus points to participants
    UPDATE profiles
    SET points = profiles.points + 50
    WHERE id IN (
      SELECT profile_id 
      FROM action_group_participants 
      WHERE group_id = group_id_to_update
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Ensure the trigger exists (idempotent)
DROP TRIGGER IF EXISTS update_group_progress_on_task_change ON tasks;
CREATE TRIGGER update_group_progress_on_task_change
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_group_progress();
