-- Fix the profile record to match the auth user UUID
-- First, let's see what we have
SELECT 'auth.users' as table_name, id, email FROM auth.users WHERE email = 'lilia@schraut.de'
UNION ALL
SELECT 'public.profiles' as table_name, id::text, email FROM public.profiles WHERE email = 'lilia@schraut.de';

-- Update the profile to use the auth user's UUID
UPDATE public.profiles 
SET id = (SELECT id FROM auth.users WHERE email = 'lilia@schraut.de')
WHERE email = 'lilia@schraut.de';

-- Verify the fix
SELECT 'After fix - auth.users' as table_name, id, email FROM auth.users WHERE email = 'lilia@schraut.de'
UNION ALL
SELECT 'After fix - public.profiles' as table_name, id::text, email FROM public.profiles WHERE email = 'lilia@schraut.de';
