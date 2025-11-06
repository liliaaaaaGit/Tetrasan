# 🎮 Interactive Features Guide - Admin Section

## 🎯 Overview of New Features (Prompt #2)

This guide shows you how to test all the interactive admin features that were just implemented.

---

## ✅ Feature 1: Employee List with Search (20-25 Employees)

### Location
```
http://localhost:3000/admin/employees
```

### What to Test

1. **View the Employee List**
   - You should see **25 dummy employees** (Max Mustermann, Anna Schmidt, etc.)
   - Each row shows: Name, E-Mail, Telefon (desktop only), Status badge

2. **Search Functionality**
   - Type "Max" in the search box → Only Max Mustermann appears
   - Type "schmidt" → Only Anna Schmidt appears
   - Type "@tetrasan.de" → All employees appear (they all have this domain)
   - Clear the search → All 25 employees reappear
   - Employee count updates: "25 Mitarbeiter" or "1 Mitarbeiter (gefiltert von 25)"

3. **Click on a Row**
   - Click anywhere on "Max Mustermann" row
   - You navigate to `/admin/employees/1`
   - This is the employee detail page

---

## ✅ Feature 2: Add Employee Modal

### How to Open
```
Click "Mitarbeiter anlegen" button (top right on /admin/employees)
```

### What to Test

1. **Open the Modal**
   - Modal appears with overlay
   - Contains fields: Name, E-Mail, Telefon, Aktiv (checkbox)

2. **Validation**
   - Click "Speichern" without filling anything → Red error messages appear
   - Fill only Name → Still shows "E-Mail ist erforderlich"
   - Enter invalid email (e.g., "test") → Shows "Ungültige E-Mail-Adresse"

3. **Add a New Employee**
   - Name: "Test Mitarbeiter"
   - E-Mail: "test@tetrasan.de"
   - Telefon: "0176 12345678"
   - Aktiv: ✓ (checked)
   - Click "Speichern"
   - Modal closes
   - New employee appears at the bottom of the list!
   - **Count updates to 26 Mitarbeiter**

4. **Cancel Button**
   - Click "Mitarbeiter anlegen" again
   - Fill in some data
   - Click "Abbrechen"
   - Modal closes, data is not saved

5. **Click Outside Modal**
   - Click "Mitarbeiter anlegen" again
   - Click on the dark overlay (outside the modal)
   - Modal closes

---

## ✅ Feature 3: Interactive Cutoff/Approval Badge

### Location
```
http://localhost:3000/admin/employees/1
```

### What to Test

1. **Initial State**
   - Badge shows "Monat offen" (blue outline)
   - Below it: Info text "Nach der Freigabe können nur Administratoren Einträge ändern."

2. **Toggle the Status**
   - Click the "Umschalten" button (top right of status section)
   - Badge changes to "Monat freigegeben" (green outline)
   - Click again → Back to "Monat offen" (blue)
   - You can toggle as many times as you want

3. **Visual Differences**
   - Blue badge = Month open (employees can still edit)
   - Green badge = Month approved (locked for employees)

---

## ✅ Feature 4: Detail Page Tabs (Desktop & Mobile)

### Location
```
http://localhost:3000/admin/employees/1
```

### What to Test

#### Desktop View (Wide Screen)

1. **Tabs at Top**
   - You see 3 tabs: "Stunden", "Tagesbefreiung", "Urlaub"
   - "Stunden" is active by default (blue underline)
   - Click "Tagesbefreiung" → Content changes
   - Click "Urlaub" → Content changes
   - Active tab is highlighted in blue

#### Mobile View (Narrow Screen)

1. **Open Chrome DevTools**
   - Press F12
   - Click the mobile icon (top left)
   - Choose "iPhone 12" or similar

2. **Accordions**
   - Tabs become **accordions** (expandable sections)
   - Click "Stunden" header → Expands to show content
   - Click again → Collapses
   - Chevron icon rotates when expanded

---

## ✅ Feature 5: Hours Tab with Correction Stub

### Location
```
http://localhost:3000/admin/employees/1
Tab: "Stunden"
```

### What to Test

1. **View Hours Entries**
   - You see 3 hours entries (14.10, 13.10, 12.10)
   - Each shows: Datum, Von, Bis, Pause, Stunden, Hinweis

2. **Red Correction Stub**
   - Under the FIRST entry (14.10.2024), there's a **red block**
   - It shows:
     - "Korrektur (Admin)" label
     - Timestamp: "15.10.2024 09:30"
     - Corrected times: Von: 07:00, Bis: 16:00, Pause: 30 min
     - Comment: "Korrektur nach Rücksprache mit Vorarbeiter"
   - Red alert icon on the left
   - This visually indicates an admin correction

3. **Delete Icons**
   - Each entry has a trash icon on the right
   - Hover over it → Changes color to red
   - Click it → Opens confirmation dialog (see Feature 7)

---

## ✅ Feature 6: Tagesbefreiung & Urlaub Tabs

### Tagesbefreiung Tab
```
http://localhost:3000/admin/employees/1
Tab: "Tagesbefreiung"
```

**What You See:**
- 2 day-off requests
- Each has ID (e.g., `req-101`, `req-102`) for deep-linking
- Columns: Erstellt am, Zeitraum, Kommentar, Status
- Status badges (color-coded):
  - "genehmigt" → Green
  - "eingereicht" → Blue
  - "abgelehnt" → Red
- Trash icon to delete (opens dialog)

### Urlaub Tab
```
http://localhost:3000/admin/employees/1
Tab: "Urlaub"
```

**What You See:**
- 3 leave requests (IDs: `req-201`, `req-202`, `req-203`)
- Same structure as Tagesbefreiung
- Different data (longer periods like "01.11 - 15.11")
- Status badges with colors

---

## ✅ Feature 7: Delete Confirmation Dialog

### How to Trigger

1. Go to any tab on `/admin/employees/1`
2. Click the **trash icon** on any entry
3. Dialog appears!

### What to Test

1. **Dialog Appearance**
   - Title: "Eintrag löschen?"
   - Description: "Bist du sicher? Dieser Vorgang kann nicht rückgängig gemacht werden."
   - Two buttons: "Abbrechen" (gray), "Bestätigen" (red)

2. **Abbrechen Button**
   - Click "Abbrechen"
   - Dialog closes
   - Nothing is deleted (check console: no log)

3. **Bestätigen Button**
   - Click trash icon again
   - Click "Bestätigen"
   - Dialog closes
   - Check browser console (F12 → Console tab)
   - You should see: "Delete hours with id h-1 (UI-only)"
   - **Note**: Nothing is actually deleted (UI-only for now)

4. **Click Outside**
   - Click trash icon again
   - Click on the dark overlay
   - Dialog closes

---

## ✅ Feature 8: Deep Linking

### Query Parameter: `?focus=leave`

**Test this:**

1. **Open URL with focus parameter:**
   ```
   http://localhost:3000/admin/employees/1?focus=leave
   ```

2. **Expected Result:**
   - Page opens with **Urlaub tab already active**
   - You don't need to click the tab manually
   - Content is already displayed

3. **Other variations:**
   ```
   ?focus=dayoff  → Opens Tagesbefreiung tab
   ?focus=hours   → Opens Stunden tab
   ?focus=urlaub  → Also opens Urlaub tab (German variant)
   ```

### Hash Anchor: `#req-123`

**Test this:**

1. **Open URL with hash:**
   ```
   http://localhost:3000/admin/employees/1?focus=leave#req-201
   ```

2. **Expected Result:**
   - Urlaub tab opens
   - Page **scrolls automatically** to request `req-201`
   - That request gets a **blue highlight ring** for 2 seconds
   - Then the ring fades away

3. **Try other hashes:**
   ```
   #req-101 → Scrolls to first day-off request
   #req-102 → Scrolls to second day-off request
   #h-1     → Scrolls to first hours entry
   ```

4. **Combined Test:**
   ```
   http://localhost:3000/admin/employees/1?focus=dayoff#req-101
   ```
   - Opens Tagesbefreiung tab
   - Scrolls to req-101
   - Highlights it with blue ring

---

## ✅ Feature 9: Empty States

### Test Empty States

**Hours Tab** (if no data):
- Shows: "Keine Stundeneinträge vorhanden"

**Tagesbefreiung Tab** (if no data):
- Shows: "Keine Tagesbefreiungsanträge vorhanden"

**Urlaub Tab** (if no data):
- Shows: "Keine Urlaubsanträge vorhanden"

**To see empty states:**
- Currently all tabs have dummy data
- In real implementation, these would show when filtering by month with no data

---

## ✅ Feature 10: Mobile Responsiveness

### Test on Mobile

1. **Open DevTools** (F12)
2. **Enable Device Toolbar** (Ctrl+Shift+M or click mobile icon)
3. **Select Device**: iPhone 12 Pro

### What Changes on Mobile:

**Employee List Page:**
- "Telefon" column disappears (only on desktop)
- Search bar is full-width
- Table scrolls horizontally if needed

**Employee Detail Page:**
- Tabs → Accordions
- Status badge section stacks vertically
- Hours entries stack in single column
- Delete icons stay visible

**Modal:**
- Takes more screen width
- Form fields stack nicely

---

## 🎨 Accessibility Features

### Keyboard Navigation

1. **Tab Key Navigation**
   - Press Tab to move through interactive elements
   - Search box → Add button → Table rows → etc.

2. **Focus States**
   - All buttons show blue outline when focused
   - Table rows highlight on focus
   - Dialog buttons are keyboard-accessible

3. **ARIA Labels**
   - Search input has `aria-label="Mitarbeiter suchen"`
   - Delete buttons have `aria-label="Eintrag löschen"`
   - Close buttons have `aria-label="Schließen"`

---

## 📊 Complete Testing Checklist

Go through this list to verify everything works:

### Employee List Page
- [ ] 25 employees visible
- [ ] Search filters by name ✓
- [ ] Search filters by email ✓
- [ ] Employee count updates ✓
- [ ] Click row navigates to detail ✓
- [ ] "Mitarbeiter anlegen" button opens modal ✓

### Add Employee Modal
- [ ] Modal opens/closes ✓
- [ ] Name validation works ✓
- [ ] Email validation works ✓
- [ ] Invalid email shows error ✓
- [ ] Saving adds new employee to list ✓
- [ ] Cancel button closes without saving ✓
- [ ] Click outside closes modal ✓

### Employee Detail Page
- [ ] Employee name and email displayed ✓
- [ ] Cutoff badge visible ✓
- [ ] "Umschalten" button toggles badge ✓
- [ ] Blue badge = "Monat offen" ✓
- [ ] Green badge = "Monat freigegeben" ✓
- [ ] 3 tabs visible (desktop) ✓
- [ ] Tabs become accordions (mobile) ✓

### Hours Tab
- [ ] 3 hours entries visible ✓
- [ ] First entry has red correction stub ✓
- [ ] Correction shows corrected times ✓
- [ ] Delete icons present ✓
- [ ] Delete icons trigger dialog ✓

### Tagesbefreiung Tab
- [ ] 2 requests visible ✓
- [ ] Status badges color-coded ✓
- [ ] Request IDs (req-101, req-102) visible in DOM ✓
- [ ] Delete icons work ✓

### Urlaub Tab
- [ ] 3 requests visible ✓
- [ ] Status badges color-coded ✓
- [ ] Request IDs (req-201, req-202, req-203) visible ✓
- [ ] Delete icons work ✓

### Delete Dialog
- [ ] Opens when clicking trash icon ✓
- [ ] Shows correct title and text ✓
- [ ] "Abbrechen" closes dialog ✓
- [ ] "Bestätigen" closes dialog + logs to console ✓
- [ ] Click outside closes dialog ✓

### Deep Linking
- [ ] `?focus=leave` opens Urlaub tab ✓
- [ ] `?focus=dayoff` opens Tagesbefreiung tab ✓
- [ ] `?focus=hours` opens Stunden tab ✓
- [ ] `#req-201` scrolls to request ✓
- [ ] Hash adds blue highlight ring ✓
- [ ] Highlight fades after 2 seconds ✓

### Mobile (DevTools)
- [ ] Tabs become accordions ✓
- [ ] Accordions expand/collapse ✓
- [ ] Chevron rotates ✓
- [ ] Telefon column hidden ✓

---

## 🚀 Quick Test Path

**5-Minute Full Feature Test:**

1. Open http://localhost:3000/admin/employees
2. Search for "Max" → verify filter works
3. Click "Mitarbeiter anlegen" → add "Test User" → verify it appears
4. Click on "Max Mustermann" → go to detail page
5. Click "Umschalten" → verify badge toggles blue/green
6. Click "Tagesbefreiung" tab → verify content changes
7. Click trash icon → verify dialog appears → click "Abbrechen"
8. Open new tab with: http://localhost:3000/admin/employees/1?focus=leave#req-201
9. Verify: Urlaub tab is active, page scrolled to req-201 with blue ring
10. Open DevTools mobile view → verify tabs become accordions

**If all 10 steps work → Everything is perfect! 🎉**

---

## 🎓 For Beginners: What's Happening?

### Client-Side State
All data is stored in React state (memory). When you refresh the page, new employees you added disappear. This is normal! In the future, we'll save to Supabase.

### UI-Only Deletion
When you "delete" something, it just logs to the console. Nothing actually disappears yet. Real deletion will come with Supabase integration.

### Deep Linking
The URL parameters (`?focus=leave`) and hash anchors (`#req-201`) make the page smart. You can share a link that opens directly to a specific tab and scrolls to a specific request!

---

## 🎊 All Done!

You now have a **fully interactive admin section** with:
- 25 dummy employees
- Working search
- Add employee modal with validation
- Interactive status toggle
- Tabs/accordions (responsive)
- Red correction stubs
- Delete confirmation dialogs
- Deep linking support

**Next step:** Supabase integration to make this data real!

