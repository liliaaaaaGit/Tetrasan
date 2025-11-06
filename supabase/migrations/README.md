# Database Migrations

## Password Reset Requests Table

To enable employee password reset functionality, run the following migration:

**File:** `create_password_reset_requests.sql`

### How to Apply

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `create_password_reset_requests.sql`
4. Run the migration

### What it creates

- `password_reset_requests` table for tracking employee password reset requests
- RLS policies that allow only admins to read/update reset requests
- Indexes for performance

### Notes

- The table is automatically created when the first employee reset request is made (if it doesn't exist yet)
- Admins can view and process reset requests via `/admin/password-resets`

