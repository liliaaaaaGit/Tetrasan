# 🔧 Environment Variables Setup

## Quick Setup (Choose One Method)

### Method 1: Interactive Script (Recommended)

```bash
node setup-env.js
```

This script will ask you for your Supabase credentials and create `.env.local` automatically.

### Method 2: Manual Setup

1. **Create `.env.local` file** in project root
2. **Copy content** from `supabase-env-template.txt`
3. **Replace placeholder values** with your actual Supabase credentials

---

## Getting Your Supabase Credentials

1. **Go to:** https://app.supabase.com
2. **Select your project**
3. **Go to:** Settings (⚙️) → API
4. **Copy these 3 values:**

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Required Variables

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Dashboard → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key (safe for browser) | Dashboard → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (server-only) | Dashboard → API → service_role |
| `ALLOWLIST_MOCK` | Use mock allow-list | Set to `true` for development |

---

## Example .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.example-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk4NzY4MDAwLCJleHAiOjIwMTQzNDQwMDB9.example-service-role-key
ALLOWLIST_MOCK=true
```

---

## After Setup

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Test signup:**
   - Go to http://localhost:3000/signup
   - Use email: `max@tetrasan.de`
   - Password: `password123`

3. **Check Supabase dashboard:**
   - Authentication → Users
   - See your new user!

---

## Security Notes

### ✅ Safe to Share
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### ⚠️ Keep Secret
- `SUPABASE_SERVICE_ROLE_KEY` (has full database access!)

### 🔒 Already Protected
- `.env.local` is in `.gitignore`
- Won't be committed to git
- Service role key has security guard in code

---

## Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL"
- Check `.env.local` exists in project root
- No typos in variable names
- Restart server after creating file

### "Admin client cannot be used client-side"
- This is a security feature working correctly!
- Service role key is server-only
- Check you're not importing admin client in Client Components

### Signup works but can't login
- Check Supabase dashboard → Authentication → Users
- Make sure "Email Confirmed" has ✓
- If not: Click user → Actions → Confirm email

---

## Files Created

- `supabase-env-template.txt` - Template with all variables
- `setup-env.js` - Interactive setup script
- `ENV-SETUP.md` - This guide

**Choose your preferred method and get started!** 🚀
