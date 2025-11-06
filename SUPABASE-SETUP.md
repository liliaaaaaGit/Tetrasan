# 🔧 Supabase Setup Instructions

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration

# Public Supabase URL (safe for client-side use)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Public anonymous key (safe for client-side use)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service role key (SERVER-SIDE ONLY - NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Enable mock allow-list for local development
# Set to 'true' to use in-memory allow-list before profiles table is ready
ALLOWLIST_MOCK=true
```

## Getting Your Supabase Credentials

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to Project Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Database Setup (TODO)

Once you're ready to move beyond the mock allow-list, create a `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Service role can do anything (for admin operations)
-- RLS policies will be refined in later prompts
```

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key is NEVER in client code
- [ ] Supabase project is in EU region (GDPR)
- [ ] Email auth is enabled in Supabase dashboard
- [ ] Email templates use neutral German copy

## Mock Mode

With `ALLOWLIST_MOCK=true`, the system uses the in-memory allow-list from Prompt #5:
- max@tetrasan.de
- anna@tetrasan.de
- thomas@tetrasan.de
- (and 7 more)

Once profiles table exists, set `ALLOWLIST_MOCK=false`.

