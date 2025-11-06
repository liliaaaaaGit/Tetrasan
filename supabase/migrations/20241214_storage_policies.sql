-- Tetrasan Time-Tracking App - Storage Buckets and Policies
-- Migration: 20241214_storage_policies.sql
-- Description: Creates storage buckets and RLS policies for file uploads

-- ===========================================
-- STORAGE BUCKETS
-- ===========================================

-- Create forms-templates bucket (public read, admin write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forms-templates',
  'forms-templates',
  true,  -- Public read access
  10485760,  -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create forms-uploads bucket (private, employee-specific)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forms-uploads',
  'forms-uploads',
  false,  -- Private access only
  52428800,  -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
);

-- ===========================================
-- STORAGE HELPER FUNCTIONS
-- ===========================================

-- Check if current user is admin (for storage policies)
CREATE OR REPLACE FUNCTION storage.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND active = true
  );
$$;

-- Check if object name starts with user's UUID (for employee access)
CREATE OR REPLACE FUNCTION storage.is_owner_prefix(object_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT position(auth.uid()::text || '/' IN object_name) = 1;
$$;

-- ===========================================
-- STORAGE POLICIES - FORMS-TEMPLATES
-- ===========================================

-- Forms-templates: SELECT - public read (authenticated users)
CREATE POLICY "forms_templates_select_authenticated" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'forms-templates' AND
    auth.role() = 'authenticated'
  );

-- Forms-templates: INSERT - admin only
CREATE POLICY "forms_templates_insert_admin_only" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'forms-templates' AND
    auth.role() = 'authenticated' AND
    storage.is_admin()
  );

-- Forms-templates: UPDATE - admin only
CREATE POLICY "forms_templates_update_admin_only" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'forms-templates' AND
    auth.role() = 'authenticated' AND
    storage.is_admin()
  );

-- Forms-templates: DELETE - admin only
CREATE POLICY "forms_templates_delete_admin_only" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'forms-templates' AND
    auth.role() = 'authenticated' AND
    storage.is_admin()
  );

-- ===========================================
-- STORAGE POLICIES - FORMS-UPLOADS
-- ===========================================

-- Forms-uploads: SELECT - admin or owner (employee reads own uploads)
CREATE POLICY "forms_uploads_select_admin_or_owner" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'forms-uploads' AND
    auth.role() = 'authenticated' AND (
      storage.is_admin() OR
      storage.is_owner_prefix(name)
    )
  );

-- Forms-uploads: INSERT - admin or owner (employees can only write to own prefix)
CREATE POLICY "forms_uploads_insert_admin_or_owner" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'forms-uploads' AND
    auth.role() = 'authenticated' AND (
      storage.is_admin() OR
      storage.is_owner_prefix(name)
    )
  );

-- Forms-uploads: UPDATE - admin or owner
CREATE POLICY "forms_uploads_update_admin_or_owner" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'forms-uploads' AND
    auth.role() = 'authenticated' AND (
      storage.is_admin() OR
      storage.is_owner_prefix(name)
    )
  );

-- Forms-uploads: DELETE - admin or owner
CREATE POLICY "forms_uploads_delete_admin_or_owner" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'forms-uploads' AND
    auth.role() = 'authenticated' AND (
      storage.is_admin() OR
      storage.is_owner_prefix(name)
    )
  );

-- ===========================================
-- STORAGE BUCKET COMMENTS
-- ===========================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads and templates';

-- Add comments to the specific buckets we created
-- Note: We can't add comments directly to bucket rows, but we document them here

/*
STORAGE BUCKET STRUCTURE:

forms-templates:
- Purpose: Store template files (vacation_template.pdf, dayoff_template.pdf)
- Access: Public read for authenticated users, admin write only
- Path: Direct files (e.g., vacation_template.pdf)
- Size limit: 10MB
- Allowed types: PDF, DOC, DOCX

forms-uploads:
- Purpose: Store employee-uploaded files (leave requests, day-off forms)
- Access: Private, employee-specific prefixes
- Path pattern: {employee_id}/YYYY/MM/{uuid}.{pdf|jpg|png}
- Size limit: 50MB
- Allowed types: PDF, JPEG, PNG, JPG
- Example: 123e4567-e89b-12d3-a456-426614174000/2024/12/abc123.pdf

SECURITY MODEL:
- Employees can only access files in their own prefix (employee_id/)
- Admins can access all files
- Templates are readable by all authenticated users
- Uploads are private to the employee who uploaded them
*/
