/*
  # Create course system functions

  1. Functions
    - `trigger_update_course_progress` - Update enrollment progress when module is completed
    - `generate_course_certificate` - Generate certificate when course is completed

  2. Triggers
    - Connect triggers to course_progress table

  3. Course Progress Logic
    - Automatic enrollment progress calculation
    - Certificate generation on completion
*/

-- Function to update course enrollment progress
CREATE OR REPLACE FUNCTION trigger_update_course_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  enrollment_record record;
  total_modules integer;
  completed_modules integer;
  progress_percentage numeric;
BEGIN
  -- Get enrollment details
  SELECT * INTO enrollment_record
  FROM course_enrollments
  WHERE id = NEW.enrollment_id;
  
  IF enrollment_record IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count total and completed modules
  SELECT COUNT(*) INTO total_modules
  FROM course_modules
  WHERE course_id = enrollment_record.course_id;
  
  SELECT COUNT(*) INTO completed_modules
  FROM course_progress
  WHERE enrollment_id = NEW.enrollment_id;
  
  -- Calculate progress percentage
  IF total_modules > 0 THEN
    progress_percentage := (completed_modules::numeric / total_modules) * 100;
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Update enrollment
  UPDATE course_enrollments
  SET 
    progress_percentage = progress_percentage,
    status = CASE 
      WHEN progress_percentage >= 100 THEN 'completed'
      WHEN progress_percentage > 0 THEN 'in-progress'
      ELSE status
    END,
    completed_at = CASE 
      WHEN progress_percentage >= 100 AND completed_at IS NULL THEN now()
      ELSE completed_at
    END
  WHERE id = NEW.enrollment_id;
  
  -- Generate certificate if course is completed
  IF progress_percentage >= 100 THEN
    PERFORM generate_course_certificate(NEW.enrollment_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to generate course certificate
CREATE OR REPLACE FUNCTION generate_course_certificate(enrollment_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  enrollment_record record;
  certificate_id uuid;
  certificate_number text;
  verification_code text;
BEGIN
  -- Get enrollment with course and profile data
  SELECT 
    ce.*,
    c.title as course_title,
    c.instructor,
    c.points,
    p.name as profile_name
  INTO enrollment_record
  FROM course_enrollments ce
  JOIN courses c ON c.id = ce.course_id
  JOIN profiles p ON p.id = ce.profile_id
  WHERE ce.id = enrollment_id_param;
  
  IF enrollment_record IS NULL OR enrollment_record.status != 'completed' THEN
    RAISE EXCEPTION 'Enrollment not found or not completed';
  END IF;
  
  -- Check if certificate already exists
  SELECT id INTO certificate_id
  FROM certificates
  WHERE enrollment_id = enrollment_id_param;
  
  IF certificate_id IS NOT NULL THEN
    RETURN certificate_id;
  END IF;
  
  -- Generate certificate number and verification code
  certificate_number := 'CERT-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('certificate_sequence')::text, 6, '0');
  verification_code := UPPER(SUBSTRING(MD5(random()::text), 1, 8));
  
  -- Create certificate
  INSERT INTO certificates (
    profile_id,
    course_id,
    enrollment_id,
    certificate_number,
    verification_code,
    issued_at
  ) VALUES (
    enrollment_record.profile_id,
    enrollment_record.course_id,
    enrollment_id_param,
    certificate_number,
    verification_code,
    now()
  ) RETURNING id INTO certificate_id;
  
  -- Award points to user
  UPDATE profiles
  SET points = points + enrollment_record.points
  WHERE id = enrollment_record.profile_id;
  
  -- Create notification
  INSERT INTO notifications (profile_id, title, message, type, category, related_id)
  VALUES (
    enrollment_record.profile_id,
    '🎓 Certificado Gerado!',
    'Parabéns! Você concluiu o curso "' || enrollment_record.course_title || '" e ganhou ' || enrollment_record.points || ' pontos!',
    'success',
    'course_completed',
    certificate_id::text
  );
  
  RETURN certificate_id;
END;
$$;

-- Create sequence for certificate numbers
CREATE SEQUENCE IF NOT EXISTS certificate_sequence START 1;

-- Create the trigger
DROP TRIGGER IF EXISTS course_progress_update ON course_progress;
CREATE TRIGGER course_progress_update
  AFTER INSERT ON course_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_course_progress();