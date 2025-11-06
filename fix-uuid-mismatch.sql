-- Fix the UUID mismatch for admin@tetrasan.de
-- First, let's see the current state
SELECT 'auth.users' as table_name, id, email FROM auth.users WHERE email = 'admin@tetrasan.de'
UNION ALL
SELECT 'public.profiles' as table_name, id::text, email FROM public.profiles WHERE email = 'admin@tetrasan.de';

-- Update the profile to use the correct UUID from auth.users
UPDATE public.profiles 
SET id = (SELECT id FROM auth.users WHERE email = 'admin@tetrasan.de')
WHERE email = 'admin@tetrasan.de';

-- Verify the fix
SELECT 'After fix - auth.users' as table_name, id, email FROM auth.users WHERE email = 'admin@tetrasan.de'
UNION ALL
SELECT 'After fix - public.profiles' as table_name, id::text, email FROM public.profiles WHERE email = 'admin@tetrasan.de';
