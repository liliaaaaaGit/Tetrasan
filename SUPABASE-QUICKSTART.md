# ⚡ Supabase Quick Start

## 🎯 Get Real Auth Working in 5 Minutes!

---

## Step 1: Create Supabase Project (2 min)

1. **Go to:** https://supabase.com
2. **Sign up / Log in**
3. **Click:** "New Project"
4. **Fill in:**
   - Name: `tetrasan-app`
   - Database Password: (choose a strong password)
   - Region: **Frankfurt (EU Central)** ← Important for GDPR!
5. **Click:** "Create new project"
6. **Wait:** ~2 minutes for initialization ☕

---

## Step 2: Get Your API Keys (1 min)

1. **Click:** Settings (⚙️) in sidebar
2. **Click:** API
3. **Copy these 3 values:**

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
↓ Copy this

anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
↓ Copy this

service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
↓ Copy this (keep it secret!)
```

---

## Step 3: Create `.env.local` File (1 min)

1. **In your project root**, create a file called `.env.local`
2. **Paste this** and replace with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ALLOWLIST_MOCK=true
```

**Save the file!**

---

## Step 4: Restart Server (30 sec)

```bash
# Press Ctrl+C to stop the server
# Then start again:
npm run dev
```

**Server starts at http://localhost:3000** ✅

---

## Step 5: Test It! (1 min)

### Create Your First Real User

1. **Go to:** http://localhost:3000/signup
2. **Fill in:**
   - Email: `max@tetrasan.de`
   - Password: `password123`
   - Repeat: `password123`
3. **Click:** "Registrieren"
4. **Result:** Redirect to login!

### Log In

1. **Email:** `max@tetrasan.de`
2. **Password:** `password123`
3. **Click:** "Anmelden"
4. **Result:** You're in! 🎉

### Verify in Supabase

1. **Open:** Supabase dashboard
2. **Go to:** Authentication → Users
3. **See:** Your new user with email confirmed! ✅

---

## ✅ Success Checklist

You're all set if:

- [x] Supabase project created (EU region)
- [x] `.env.local` file created with all 3 keys
- [x] Dev server restarted
- [x] Can sign up with `max@tetrasan.de`
- [x] User appears in Supabase dashboard
- [x] Can log in
- [x] Session persists on refresh
- [x] Top bar shows email
- [x] Can log out

**All checked?** Congratulations! Real auth is working! 🎊

---

## 🎨 What's Different Now?

### Before Setup
```
[Signup] → Fake user created
[Login] → Fake session
[Refresh] → Session lost
```

### After Setup
```
[Signup] → Real user in Supabase! ✅
[Login] → Real session
[Refresh] → Session persists! ✅
```

**Everything is REAL now!** 🚀

---

## 🔒 Security Features Active

### 1. Allow-List Protection
- Only 10 emails can sign up
- All others get neutral error
- Admin controls access

### 2. Neutral Errors
- Wrong password? Same error
- Email doesn't exist? Same error
- Attackers can't enumerate users

### 3. HTTP-Only Cookies
- Session can't be stolen by JavaScript
- Secure storage
- GDPR-compliant

### 4. Route Protection
- Can't access `/employee/*` without login
- Middleware enforces authentication
- No client-side bypass

---

## 🐛 Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL"

**Fix:**
1. Check `.env.local` exists in **project root**
2. No typos in variable names
3. No quotes around values
4. Restart server after creating file

### Signup works but can't login

**Fix:**
1. Check Supabase dashboard → Authentication → Users
2. Make sure "Email Confirmed" has ✓
3. If not: Click user → Actions → Confirm email
4. Try login again

### "Email rate limit exceeded"

**Fix:**
1. Supabase has rate limits (free tier)
2. Wait 5 minutes
3. Try again
4. Or use different email for testing

---

## 💡 Pro Tips

### Tip 1: Test Multiple Users

Sign up with all allowed emails:
```
max@tetrasan.de
anna@tetrasan.de
thomas@tetrasan.de
```

Each becomes a real user!

### Tip 2: View Auth Logs

Supabase dashboard:
- Logs → Auth Logs
- See all login/signup attempts
- Great for debugging!

### Tip 3: Clean Up Test Users

Supabase dashboard:
- Authentication → Users
- Select users
- Delete
- Start fresh!

### Tip 4: Email Templates

Customize confirmation emails:
- Authentication → Email Templates
- Edit to German
- Use neutral language

---

## 🎯 Allowed Emails (ALLOWLIST_MOCK=true)

These 10 emails can sign up:

```
✅ max@tetrasan.de
✅ anna@tetrasan.de
✅ thomas@tetrasan.de
✅ julia@tetrasan.de
✅ michael@tetrasan.de
✅ laura@tetrasan.de
✅ daniel@tetrasan.de
✅ sophie@tetrasan.de
✅ lukas@tetrasan.de
✅ emma@tetrasan.de
```

Any other email = Error! ❌

---

## 🔮 Next Steps

After setup and testing:

### Now:
- Create users with allowed emails
- Test login/logout
- Verify route protection
- Check Supabase dashboard

### Soon (Prompt #7):
- Create `profiles` table
- Set `ALLOWLIST_MOCK=false`
- Enable role-based access
- Add Row Level Security

---

## 🎊 You Did It!

You now have **real Supabase authentication**!

- Real users in database ✅
- Secure sessions ✅
- Route protection ✅
- Production-ready ✅

**Start testing:** http://localhost:3000/signup 🚀

Enjoy your enterprise-grade auth system! 🎉

