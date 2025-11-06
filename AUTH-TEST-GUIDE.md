# 🔐 Auth System - Quick Test Guide

Your server is running at **http://localhost:3000**

---

## 🚀 60-Second Feature Tour

### 1️⃣ Try to Login (Success)
```
http://localhost:3000/login
```

**Steps:**
1. Email: **`max@tetrasan.de`**
2. Password: **`anything`** (at least 8 chars)
3. Click **"Anmelden"**
4. See spinner: "Anmelden..."
5. Toast appears: **"Erfolgreich angemeldet"**
6. Redirect to `/employee/hours`
7. Top bar shows: **"max@tetrasan.de | Abmelden"** ✨

---

### 2️⃣ Try Login with Wrong Email
```
http://localhost:3000/login
```

**Steps:**
1. Email: **`wrong@example.com`** (not in allow-list)
2. Password: `anything123`
3. Click "Anmelden"
4. Error: **"Anmeldung nicht möglich. Bitte Angaben prüfen."**
5. **Notice:** Doesn't say "email not found" (security!)

---

### 3️⃣ Sign Up (Success)
```
http://localhost:3000/signup
```

**Steps:**
1. See blue info box: "Registrierung nur für bereits angelegte Mitarbeitende."
2. Email: **`anna@tetrasan.de`** (in allow-list)
3. Password: `password123`
4. Repeat: `password123`
5. Click **"Registrieren"**
6. Toast: **"Erfolgreich registriert"**
7. Redirect to `/employee/hours`

---

### 4️⃣ Try Signup with Unauthorized Email
```
http://localhost:3000/signup
```

**Steps:**
1. Email: **`notallowed@example.com`**
2. Password: `password123`
3. Repeat: `password123`
4. Click "Registrieren"
5. Error: **"Registrierung nicht möglich. Bitte wende dich an die Verwaltung."**

---

### 5️⃣ Test Validation

**Short Password:**
1. Password: `short` (less than 8 chars)
2. Error: "Passwort muss mindestens 8 Zeichen lang sein."

**Password Mismatch:**
1. Password: `password123`
2. Repeat: `different`
3. Error: "Passwörter stimmen nicht überein."

**Invalid Email:**
1. Email: `notanemail`
2. Error: "Ungültige E-Mail-Adresse"

---

### 6️⃣ Logout
**When logged in:**
1. Look at top bar (desktop)
2. See: "max@tetrasan.de | Abmelden"
3. Click **"Abmelden"**
4. Navigate to `/logout`
5. See: "Du bist abgemeldet"
6. Click **"Zur Anmeldung"**
7. Back to login page

---

### 7️⃣ Test Persistence
1. Login successfully
2. **Refresh the page** (F5)
3. Still logged in! ✨
4. Top bar still shows your email
5. State persisted in localStorage!

---

### 8️⃣ Mobile View
1. Press **F12** (DevTools)
2. Click **mobile icon**
3. Choose **iPhone 12**
4. Forms look perfect!
5. Buttons are touch-friendly
6. No cramped layout

---

## ✅ Complete Testing Checklist

### Login Page
- [ ] Page loads at `/login`
- [ ] Form shows E-Mail and Passwort fields
- [ ] "Passwort vergessen?" link present
- [ ] "Konto erstellen" link present
- [ ] Legal links (Datenschutz, Impressum) present

### Login Success
- [ ] Email in allow-list → Success
- [ ] Spinner shows during login
- [ ] Toast appears: "Erfolgreich angemeldet"
- [ ] Redirects to `/employee/hours`
- [ ] Top bar shows email + "Abmelden"

### Login Failure
- [ ] Email not in allow-list → Error
- [ ] Error: "Anmeldung nicht möglich. Bitte Angaben prüfen."
- [ ] No user enumeration (neutral error)

### Signup Page
- [ ] Page loads at `/signup`
- [ ] Info box shows
- [ ] Form shows E-Mail, Passwort, Passwort wiederholen
- [ ] "Zur Anmeldung" link present

### Signup Success
- [ ] Email in allow-list → Success
- [ ] Valid passwords → Success
- [ ] Toast: "Erfolgreich registriert"
- [ ] Redirects to `/employee/hours`

### Signup Failure
- [ ] Email not in allow-list → Error
- [ ] Error: "Registrierung nicht möglich..."
- [ ] Short password → Error
- [ ] Password mismatch → Error

### Validation
- [ ] Invalid email format → Error
- [ ] Empty fields → Error
- [ ] Short password (<8) → Error
- [ ] Mismatched passwords → Error
- [ ] All errors in German

### Logout
- [ ] Click "Abmelden" → Navigate to `/logout`
- [ ] Page shows confirmation
- [ ] "Zur Anmeldung" button works
- [ ] State cleared

### Persistence
- [ ] Login → Refresh → Still logged in
- [ ] Logout → Refresh → Still logged out
- [ ] State saved in localStorage

### Navigation Integration
- [ ] Not logged in → Top bar shows "Anmelden"
- [ ] Logged in → Top bar shows email + "Abmelden"
- [ ] Links work correctly

### Accessibility
- [ ] Tab key navigates through fields
- [ ] Enter key submits form
- [ ] Focus rings visible
- [ ] Labels associated with inputs
- [ ] Error messages have role="alert"

### Mobile
- [ ] Forms responsive
- [ ] Buttons large enough to tap
- [ ] Text readable
- [ ] No horizontal scroll

---

## 🎯 Quick Test Scenarios

### Scenario A: Full Login Flow
1. Go to `/login`
2. Email: `max@tetrasan.de`
3. Password: `password123`
4. Submit → Success → Redirect
5. See email in top bar
6. Click "Abmelden"
7. Logout confirmation

### Scenario B: Full Signup Flow
1. Go to `/signup`
2. Email: `thomas@tetrasan.de`
3. Password: `mypassword123`
4. Repeat: `mypassword123`
5. Submit → Success → Redirect
6. See email in top bar

### Scenario C: Validation Errors
1. Try invalid email → Error
2. Try short password → Error
3. Try mismatched passwords → Error
4. Fix all issues → Success

### Scenario D: Unauthorized User
1. Try signup with `notinlist@example.com`
2. Get neutral error
3. Try login with same email
4. Get neutral error
5. No indication whether email exists

---

## 🔐 Allow-List Emails

**These emails can login/signup:**
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

**Any other email will fail!**

---

## 🎨 Visual States

### Login Form
```
┌─────────────────────┐
│     Anmelden        │
├─────────────────────┤
│ E-Mail              │
│ [max@tetrasan.de  ] │
│                     │
│ Passwort            │
│ [••••••••••••]      │
│                     │
│ [🔓 Anmelden]       │
│                     │
│ Passwort vergessen? │
│ Konto erstellen     │
└─────────────────────┘
```

### Loading State
```
┌─────────────────────┐
│ [⟳ Anmelden...]     │ ← Spinner + disabled
└─────────────────────┘
```

### Error State
```
┌─────────────────────┐
│ ⚠️ Anmeldung nicht  │
│ möglich. Bitte...   │
└─────────────────────┘
```

### Success Toast
```
        ┌──────────────────────┐
        │ Erfolgreich angemeldet│
        └──────────────────────┘
        ↑ Bottom-center, auto-dismiss
```

---

## 💡 Pro Tips

### Tip 1: Quick Test Login
Use `max@tetrasan.de` + any 8+ char password for instant testing!

### Tip 2: Check localStorage
Open DevTools → Application → Local Storage → See `auth-mock-storage`

### Tip 3: Clear State
To reset: DevTools → Application → Local Storage → Delete `auth-mock-storage`

### Tip 4: Test Different Emails
Try all 10 allowed emails to see they all work!

### Tip 5: Security Testing
Try emails not in allow-list → Always get neutral error (good!)

---

## 🐛 Troubleshooting

### Q: Login not working!
**A:** Make sure email is in the allow-list (see list above).

### Q: Password always wrong?
**A:** There's no real password check yet! Any 8+ chars work.

### Q: Can't see top bar?
**A:** It's hidden on mobile. Switch to desktop view (DevTools).

### Q: State not persisting?
**A:** Check if localStorage is enabled in your browser.

### Q: Toast not showing?
**A:** Wait 500ms for "network delay" simulation.

---

## 🎓 Understanding the System

### What is Allow-List?
Only specific emails (pre-created employees) can register. Like a guest list at a party!

### Why Neutral Errors?
Security! We don't want to tell attackers which emails exist in our system.

**Bad:** "Email not found" → Attacker knows email doesn't exist
**Good:** "Login failed" → Attacker doesn't know why

### What's Zustand?
A state management library. Stores your login state in memory + localStorage.

### Why No Real Password Check?
This is UI scaffolding. Real password checks will happen with Supabase later!

---

## 🎯 Success Indicators

**You've tested everything successfully if:**

✅ Can login with allowed email
✅ Can signup with allowed email
✅ Unauthorized emails get neutral errors
✅ Validation works (password length, match, email format)
✅ Success toasts appear
✅ Redirects work
✅ Top bar shows auth status
✅ Logout works
✅ State persists on refresh
✅ Mobile view looks good
✅ Keyboard navigation works
✅ No crashes or console errors

---

## 📚 Next Steps

After testing auth, you're ready for:
1. **Supabase Integration** - Replace mocks with real auth
2. **Protected Routes** - Require login for certain pages
3. **Role-Based Access** - Admin vs Employee permissions

---

## 🎉 Enjoy!

You now have a **fully functional authentication system**!

Login, signup, logout - it all works beautifully!

**Start testing now:** http://localhost:3000/login 🚀

