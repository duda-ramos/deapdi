/*
  # Update Teams Table with Status Column

  1. New Columns
    - `status` (enum: active, inactive) - Team status with default 'active'
    
  2. Updates
    - Add status column to teams table
    - Set default value to 'active' for existing teams
    - Add check constraint for valid status values
    
  3. Indexes
    - Add index on status column for filtering
*/

-- Add status column to teams table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'status'
  ) THEN
    ALTER TABLE teams ADD COLUMN status TEXT DEFAULT 'active';
    
    -- Add check constraint for valid status values
    ALTER TABLE teams ADD CONSTRAINT teams_status_check 
    CHECK (status IN ('active', 'inactive'));
    
    -- Create index on status column
    CREATE INDEX IF NOT EXISTS teams_status_idx ON teams(status);
    
    -- Update existing teams to have active status
    UPDATE teams SET status = 'active' WHERE status IS NULL;
    
    -- Make status column not null
    ALTER TABLE teams ALTER COLUMN status SET NOT NULL;
  END IF;
END $$;