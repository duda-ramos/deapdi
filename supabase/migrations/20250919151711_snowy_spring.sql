/*
  # Create consent_records table

  1. New Tables
    - `consent_records`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to profiles)
      - `consent_type` (text)
      - `granted` (boolean)
      - `consent_text` (text)
      - `ip_address` (text, optional)
      - `user_agent` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `consent_records` table
    - Add policy for employees to read their own consent records
    - Add policy for employees to insert their own consent records
*/

CREATE TABLE IF NOT EXISTS public.consent_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    consent_type text NOT NULL,
    granted boolean NOT NULL,
    consent_text text NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT consent_records_pkey PRIMARY KEY (id),
    CONSTRAINT consent_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can read their own consent records" ON public.consent_records 
    FOR SELECT TO authenticated 
    USING (auth.uid() = employee_id);

CREATE POLICY "Employees can insert their own consent records" ON public.consent_records 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "HR can read all consent records" ON public.consent_records 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('hr', 'admin')
    ));