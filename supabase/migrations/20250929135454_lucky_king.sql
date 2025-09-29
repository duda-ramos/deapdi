/*
  # Create action group progress functions

  1. Functions
    - `update_group_progress` - Calculate and update group progress based on tasks
    - `trigger_update_group_progress` - Trigger for automatic progress updates

  2. Triggers
    - Connect triggers to tasks table for automatic progress calculation

  3. Group Progress Logic
    - Automatic progress calculation based on completed tasks
    - Group completion when all tasks are done
*/

-- Function to update action group progress
CREATE OR REPLACE FUNCTION update_group_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  group_id_to_update uuid;
  total_tasks integer;
  completed_tasks integer;
  progress_percentage numeric;
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
  INTO total_tasks, completed_tasks
  FROM tasks
  WHERE group_id = group_id_to_update;
  
  -- Calculate progress percentage
  IF total_tasks > 0 THEN
    progress_percentage := (completed_tasks::numeric / total_tasks) * 100;
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Update action group
  UPDATE action_groups
  SET 
    progress = progress_percentage,
    total_tasks = total_tasks,
    completed_tasks = completed_tasks,
    completed_at = CASE 
      WHEN progress_percentage = 100 AND completed_at IS NULL THEN now()
      ELSE completed_at
    END,
    status = CASE 
      WHEN progress_percentage = 100 AND status = 'active' THEN 'completed'
      ELSE status
    END
  WHERE id = group_id_to_update;
  
  -- If group is completed, notify participants
  IF progress_percentage = 100 THEN
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
    SET points = points + 50
    WHERE id IN (
      SELECT profile_id 
      FROM action_group_participants 
      WHERE group_id = group_id_to_update
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger (replace existing if it exists)
DROP TRIGGER IF EXISTS update_group_progress_on_task_change ON tasks;
CREATE TRIGGER update_group_progress_on_task_change
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_group_progress();