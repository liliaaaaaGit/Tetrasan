# 🔐 Supabase Auth - Test Guide

## ⚠️ Prerequisites

Before testing, you MUST set up Supabase credentials.

### Quick Setup (5 Minutes)

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Sign up / log in
   - Create new project (choose EU region for GDPR)
   - Wait for project to initialize (~2 minutes)

2. **Get Your Credentials:**
   - Go to Project Settings (⚙️) → API
   - Copy these 3 values:
     - **Project URL**
     - **anon** public key
     - **service_role** secret key

3. **Create `.env.local` File:**

Create this file in project root:

```env
# Copy these from Supabase dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Use mock allow-list (until profiles table exists)
ALLOWLIST_MOCK=true
```

4. **Restart Dev Server:**
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 🚀 Test Scenarios

### ✅ Test 1: Signup (Success)

**Steps:**
1. Go to http://localhost:3000/signup
2. Email: `max@tetrasan.de` (in allow-list)
3. Password: `password123`
4. Password repeat: `password123`
5. Click "Registrieren"

**Expected:**
- ✅ Redirect to `/login`
- ✅ Message: "Registrierung erfolgreich. Bitte anmelden."
- ✅ Check Supabase dashboard → Authentication → Users
- ✅ New user appears!

---

### ✅ Test 2: Signup (Not in Allow-List)

**Steps:**
1. Go to `/signup`
2. Email: `notinlist@example.com`
3. Password: `password123`
4. Password repeat: `password123`
5. Click "Registrieren"

**Expected:**
- ❌ Error: "Registrierung nicht möglich. Bitte wende dich an die Verwaltung."
- ✅ No user created in Supabase
- ✅ Neutral error (doesn't reveal email doesn't exist)

---

### ✅ Test 3: Login (Success)

**Steps:**
1. Sign up first (Test 1) if you haven't
2. Go to `/login`
3. Email: `max@tetrasan.de`
4. Password: `password123`
5. Click "Anmelden"

**Expected:**
- ✅ Redirect to `/employee/hours`
- ✅ Top bar shows "max@tetrasan.de | Abmelden"
- ✅ Calendar page loads
- ✅ Session persists on refresh!

---

### ✅ Test 4: Login (Wrong Password)

**Steps:**
1. Go to `/login`
2. Email: `max@tetrasan.de`
3. Password: `wrongpassword`
4. Click "Anmelden"

**Expected:**
- ❌ Error: "Anmeldung nicht möglich. Bitte Angaben prüfen."
- ✅ Neutral error (doesn't say "wrong password")

---

### ✅ Test 5: Login (Email Doesn't Exist)

**Steps:**
1. Go to `/login`
2. Email: `doesntexist@example.com`
3. Password: `password123`
4. Click "Anmelden"

**Expected:**
- ❌ Error: "Anmeldung nicht möglich. Bitte Angaben prüfen."
- ✅ Same error as Test 4 (no user enumeration!)

---

### ✅ Test 6: Route Protection

**Steps:**
1. **Logout** first (click "Abmelden")
2. Try to access http://localhost:3000/employee/hours

**Expected:**
- ✅ Automatic redirect to `/login`
- ✅ Can't access protected routes without login

**Then:**
1. Log in
2. Go to `/employee/hours`

**Expected:**
- ✅ Page loads successfully
- ✅ Route protection working!

---

### ✅ Test 7: Logout

**Steps:**
1. Make sure you're logged in
2. Click "Abmelden" in top bar (desktop)
3. Or go to `/logout` directly

**Expected:**
- ✅ Loading screen briefly
- ✅ "Du bist abgemeldet" message
- ✅ "Zur Anmeldung" button
- ✅ Top bar no longer shows email
- ✅ Redirected to login if you try to access `/employee/hours`

---

### ✅ Test 8: Session Persistence

**Steps:**
1. Log in successfully
2. **Refresh the page** (F5)

**Expected:**
- ✅ Still logged in!
- ✅ Top bar still shows email
- ✅ No redirect to login
- ✅ Session stored in secure cookies

**Then:**
1. **Close browser completely**
2. Reopen and go to app

**Expected:**
- ✅ Still logged in! (Cookies persist)

---

### ✅ Test 9: Validation

**Short Password:**
1. Go to `/signup`
2. Password: `short` (less than 8 chars)
3. Error: "Passwort muss mindestens 8 Zeichen lang sein."

**Password Mismatch:**
1. Password: `password123`
2. Repeat: `different`
3. Error: "Passwörter stimmen nicht überein."

**Invalid Email:**
1. Email: `notanemail`
2. Error: "Ungültige E-Mail-Adresse."

---

### ✅ Test 10: Multiple Users

**Steps:**
1. Sign up with `anna@tetrasan.de` → Success
2. Log out
3. Sign up with `thomas@tetrasan.de` → Success
4. Log out
5. Log in with `max@tetrasan.de` → Success
6. Check Supabase dashboard

**Expected:**
- ✅ 3 users in database
- ✅ Can switch between users
- ✅ Each has independent session

---

## 🔍 Verification Checklist

After testing, verify:

### Supabase Dashboard

- [ ] Go to https://app.supabase.com
- [ ] Select your project
- [ ] Authentication → Users
- [ ] See all created users
- [ ] Email confirmed = ✓ (green checkmark)

### Browser DevTools

- [ ] F12 → Application → Cookies
- [ ] See Supabase cookies (sb-xxx)
- [ ] HttpOnly = ✓ (secure!)
- [ ] Secure = ✓ (if HTTPS)

### Security

- [ ] Wrong password → Neutral error ✓
- [ ] Email doesn't exist → Neutral error ✓
- [ ] Not in allow-list → Neutral error ✓
- [ ] No user enumeration possible ✓

### Route Protection

- [ ] `/employee/hours` requires login ✓
- [ ] `/admin/employees` requires login ✓
- [ ] Logged in → Can't access `/login` ✓
- [ ] Auto-redirect working ✓

---

## 🐛 Troubleshooting

### Problem: "Missing NEXT_PUBLIC_SUPABASE_URL"

**Solution:**
1. Check `.env.local` file exists in project root
2. Copy values from Supabase dashboard
3. Restart dev server (`npm run dev`)

### Problem: Signup succeeds but can't login

**Solution:**
1. Check Supabase dashboard → Authentication → Users
2. Make sure "Email Confirmed" is ✓
3. If not: Click user → Confirm email manually
4. Or check email for confirmation link

### Problem: "Email rate limit exceeded"

**Solution:**
1. Supabase free tier has rate limits
2. Wait a few minutes
3. Or use different email addresses for testing

### Problem: Users created but login fails

**Solution:**
1. Check Supabase dashboard → Authentication → Settings
2. Make sure "Enable Email Signup" is ON
3. Save settings
4. Try again

### Problem: Route protection not working

**Solution:**
1. Clear browser cookies
2. Log out completely
3. Restart dev server
4. Try again

---

## 💡 Pro Tips

### Tip 1: Quick User Cleanup

In Supabase dashboard:
- Authentication → Users
- Select all test users
- Delete
- Start fresh!

### Tip 2: Check Logs

In Supabase dashboard:
- Logs → Auth Logs
- See all login/signup attempts
- Useful for debugging

### Tip 3: Email Templates

In Supabase dashboard:
- Authentication → Email Templates
- Customize German email messages
- Use neutral language (security!)

### Tip 4: API Keys

**DO NOT:**
- ❌ Commit `.env.local` to git
- ❌ Share service role key
- ❌ Put keys in client code

**DO:**
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Rotate keys if exposed
- ✅ Use environment variables

---

## 🎯 Allow-List Emails

These emails can sign up (when `ALLOWLIST_MOCK=true`):

```
max@tetrasan.de
anna@tetrasan.de
thomas@tetrasan.de
julia@tetrasan.de
michael@tetrasan.de
laura@tetrasan.de
daniel@tetrasan.de
sophie@tetrasan.de
lukas@tetrasan.de
emma@tetrasan.de
```

Any other email will fail with neutral error!

---

## 🎊 Success Checklist

You've successfully integrated Supabase Auth if:

- ✅ Can sign up with allowed email
- ✅ User appears in Supabase dashboard
- ✅ Can log in with created account
- ✅ Session persists on refresh
- ✅ Top bar shows user email
- ✅ Route protection works
- ✅ Logout works
- ✅ Neutral errors for security
- ✅ Can't sign up with disallowed email
- ✅ Can't access protected routes without login

**All checked? Congratulations! 🎉**

Real authentication is working!

---

## 📚 Next Steps

After testing:

1. **Create Profiles Table** (see SUPABASE-SETUP.md)
2. **Set `ALLOWLIST_MOCK=false`**
3. **Update TODOs in code**
4. **Add Row Level Security (RLS)**
5. **Test role-based access**

**For now, enjoy your working auth system!** 🚀

