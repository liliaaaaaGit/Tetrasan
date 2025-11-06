# 🗄️ Supabase Migration Guide

## Overview

This directory contains the complete database schema for the Tetrasan Time-Tracking App, including all tables, RLS policies, storage buckets, and seed data.

## Files

- `20251015_init_core.sql` - Complete database schema (main migration)
- `20251015_verification.sql` - Verification queries to test migration

## Quick Start

### 1. Apply Migration

```bash
# Push migration to your Supabase project
npx supabase db push
```

### 2. Verify Migration

```bash
# Run verification queries
npx supabase db reset --with-seed
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/20251015_verification.sql
```

## What's Included

### ✅ Core Tables (6)
- `profiles` - User directory & roles
- `timesheet_entries` - Daily time entries
- `timesheet_corrections` - Admin corrections (red blocks)
- `leave_requests` - Vacation/day-off requests
- `inbox_events` - Admin notifications
- `timesheet_months` - Monthly cutoff/approval

### ✅ Security Features
- Row Level Security (RLS) on all tables
- Employee vs admin access controls
- Month lock functionality
- Helper functions (is_admin, is_owner, is_month_open)

### ✅ Storage System
- `forms-templates` bucket (public read, admin write)
- `forms-uploads` bucket (private, employee-specific)
- Access control policies
- File size limits (10MB templates, 50MB uploads)

### ✅ Seed Data
- 1 admin: `admin@tetrasan.de`
- 2 employees: `max@tetrasan.de`, `anna@tetrasan.de`
- Sample timesheet entries
- Sample leave requests
- Sample inbox events
- Sample corrections (red blocks)

## Migration Safety

- ✅ **Idempotent**: Safe to re-run multiple times
- ✅ **IF NOT EXISTS**: All CREATE statements use IF NOT EXISTS
- ✅ **ON CONFLICT**: All INSERT statements use ON CONFLICT DO NOTHING
- ✅ **DROP IF EXISTS**: All DROP statements use IF EXISTS

## Verification

After running the migration, all verification tests should show ✅ PASS:

- ✅ All 6 core tables exist
- ✅ RLS enabled on all tables
- ✅ Both storage buckets exist
- ✅ All helper functions exist
- ✅ All 5 enums exist
- ✅ All required indexes exist
- ✅ Both update triggers exist
- ✅ All RLS policies exist
- ✅ All storage policies exist
- ✅ Seed data exists

## Next Steps

1. **Update your app** to use real database instead of mock data
2. **Set `ALLOWLIST_MOCK=false`** in your environment variables
3. **Test with seed data users**:
   - Admin: `admin@tetrasan.de`
   - Employee: `max@tetrasan.de`
4. **Connect your UI** to the database tables

## Troubleshooting

### Migration Fails
- Check Supabase project is linked correctly
- Verify you have admin access to the project
- Check for any existing conflicting data

### Verification Fails
- Re-run the migration: `npx supabase db push`
- Check Supabase dashboard for tables
- Verify RLS is enabled on all tables

### RLS Issues
- Check if policies exist in Supabase dashboard
- Verify helper functions are created
- Test with different user roles

## Support

If you encounter issues:

1. Check the verification queries first
2. Review the migration file for syntax errors
3. Check Supabase dashboard for table creation
4. Verify environment variables are set correctly

---

**Ready to deploy!** 🚀
