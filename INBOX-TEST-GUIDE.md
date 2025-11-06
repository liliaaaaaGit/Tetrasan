# 📬 Admin Inbox - Quick Test Guide

Your server is running at **http://localhost:3000**

---

## 🚀 60-Second Feature Tour

### 1️⃣ Open the Inbox
```
http://localhost:3000/admin/inbox
```

**What You See:**
- Title: "Postfach"
- Blue badge: "Ungelesen: 7" (or similar)
- Search bar
- Three filter dropdowns
- Table with 15 events
- Unread events have **blue background**

---

### 2️⃣ Search for an Employee

**Try This:**
1. Type **"Anna"** in search box
2. Only Anna Schmidt's events appear
3. Counter shows "1 Eintrag gefunden"
4. Clear search → All 15 events return

**Also Try:**
- Type "urlaub" → Only vacation requests
- Type "tagesbefreiung" → Only day-off requests

---

### 3️⃣ Filter by Read Status

**Steps:**
1. Click **Status** dropdown
2. Select **"Ungelesen"**
3. Only unread events shown (blue background)
4. Select **"Gelesen"** → Only read events
5. Select **"Alle"** → All events return

---

### 4️⃣ Filter by Type

**Steps:**
1. Click **Typ** dropdown
2. Select **"Urlaub"**
3. Only "Urlaubsantrag" badges shown
4. Select **"Tagesbefreiung"**
5. Only "Tagesbefreiung" badges shown

---

### 5️⃣ Sort Events

**Steps:**
1. Click **Sortierung** dropdown
2. Select **"Älteste zuerst"**
3. Events reverse (Oct 5 now at top)
4. Select **"Neueste zuerst"** → Back to default

---

### 6️⃣ Toggle Read/Unread

**Steps:**
1. Find an event with **"Ungelesen"** badge (blue row)
2. Click the **👁 (eye)** icon button
3. **Watch the magic:**
   - Badge changes: "Ungelesen" → "Gelesen"
   - Background changes: Blue → White
   - Unread counter decreases!
4. Click the **eye-off** icon again
5. Changes back to unread!

---

### 7️⃣ Deep-Link to Employee (The Cool Part!)

**Steps:**
1. Find Anna Schmidt's leave request (first row)
2. Click **"Öffnen"** button
3. **You navigate to employee detail page:**
   - URL: `/admin/employees/2?focus=leave#req-201`
   - **Urlaub tab is automatically active!**
   - Page scrolls to req-201
   - Request highlighted with blue ring!

**Try Another:**
1. Go back to inbox (browser back button)
2. Find Thomas Weber's day-off request
3. Click "Öffnen"
4. **Tagesbefreiung tab opens automatically!**

---

### 8️⃣ Combined Filters

**Advanced Test:**
1. Status: **"Ungelesen"**
2. Typ: **"Urlaub"**
3. See only unread vacation requests
4. Add search: **"Anna"**
5. Super-filtered results!

---

### 9️⃣ Empty State

**Steps:**
1. Type nonsense in search: **"zzz"**
2. No results
3. See empty state: "Keine Einträge gefunden"
4. Inbox icon displayed

---

### 🔟 Mobile View

**Steps:**
1. Press **F12** (DevTools)
2. Click **mobile icon**
3. Choose **iPhone 12**
4. **Table becomes cards!**
5. Each card shows all info
6. Filters stack vertically
7. Everything still works!

---

## ✅ Complete Testing Checklist

### Inbox Display
- [ ] Page shows "Postfach" title
- [ ] Subtitle: "Eingehende Anträge und Hinweise"
- [ ] Unread counter badge visible
- [ ] 15 events displayed
- [ ] Unread events have blue background

### Search
- [ ] Search by employee name works
- [ ] Search by "urlaub" shows leave requests
- [ ] Search by "tagesbefreiung" shows day-off
- [ ] Search is case-insensitive
- [ ] Clear search restores all events

### Filters
- [ ] Status filter: Alle / Ungelesen / Gelesen
- [ ] Typ filter: Alle / Urlaub / Tagesbefreiung
- [ ] Sortierung: Neueste / Älteste zuerst
- [ ] Filters work together
- [ ] Filters combine with search

### Event Display
- [ ] Date shows DD.MM.YYYY, HH:mm
- [ ] Employee name shown
- [ ] Type badge (Urlaubsantrag/Tagesbefreiung)
- [ ] Status badge ("eingereicht")
- [ ] Read badge (Ungelesen/Gelesen)
- [ ] Action buttons (Öffnen + toggle)

### Read Toggle
- [ ] Eye icon on unread events
- [ ] Eye-off icon on read events
- [ ] Click toggles status
- [ ] Badge updates immediately
- [ ] Background color changes
- [ ] Unread counter updates

### Deep Linking
- [ ] "Öffnen" navigates to employee detail
- [ ] Leave request opens Urlaub tab
- [ ] Day-off request opens Tagesbefreiung tab
- [ ] Page scrolls to specific request
- [ ] Request highlighted with blue ring

### Empty State
- [ ] Shows when no results
- [ ] Displays inbox icon
- [ ] Message: "Keine Einträge gefunden"

### Mobile
- [ ] Table becomes cards
- [ ] All info visible in cards
- [ ] Filters stack vertically
- [ ] Buttons properly sized
- [ ] Touch-friendly

### Accessibility
- [ ] Search input focusable
- [ ] Dropdowns keyboard-accessible
- [ ] Buttons reachable with Tab
- [ ] Focus states visible
- [ ] ARIA labels present

---

## 🎯 Quick Test Scenarios

### Scenario A: Find Unread Leave Requests
1. Status: "Ungelesen"
2. Typ: "Urlaub"
3. Result: All unread vacation requests

### Scenario B: Sort and Search
1. Search: "Schmidt"
2. Sort: "Älteste zuerst"
3. Result: Schmidt's events, oldest first

### Scenario C: Toggle Multiple
1. Mark 3 events as read
2. Watch unread counter decrease
3. Mark them back as unread
4. Counter increases

### Scenario D: Deep-Link Journey
1. Click "Öffnen" on leave request
2. View request on detail page
3. Go back to inbox (browser back)
4. Click different event
5. Different tab opens!

---

## 🎨 Visual States

### Unread Event (Blue Background)
```
┌─────────────────────────────────┐
│ 14.10.2024, 14:30              │ ← Blue bg
│ Anna Schmidt                    │
│ [Urlaubsantrag] [Ungelesen]    │
│ [Öffnen] [👁]                   │
└─────────────────────────────────┘
```

### Read Event (White Background)
```
┌─────────────────────────────────┐
│ 13.10.2024, 16:45              │ ← White bg
│ Max Mustermann                  │
│ [Urlaubsantrag] [Gelesen]      │
│ [Öffnen] [👁‍🗨]                  │
└─────────────────────────────────┘
```

---

## 🔗 Deep-Link Examples

**Leave Request:**
```
http://localhost:3000/admin/employees/2?focus=leave#req-201
```
→ Opens Anna Schmidt's detail
→ Urlaub tab active
→ Scrolls to req-201

**Day-Off Request:**
```
http://localhost:3000/admin/employees/3?focus=dayoff#req-102
```
→ Opens Thomas Weber's detail
→ Tagesbefreiung tab active
→ Scrolls to req-102

---

## 💡 Pro Tips

### Tip 1: Quick Unread Check
Look for blue backgrounds to spot unread events quickly!

### Tip 2: Multi-Filter
Combine all three filters + search for precise results!

### Tip 3: Counter Watching
Watch the unread counter change as you toggle events!

### Tip 4: Deep-Link Back
Browser back button works perfectly after clicking "Öffnen"!

### Tip 5: Mobile Testing
The mobile card layout is beautiful - test it!

---

## 🐛 Troubleshooting

### Q: I don't see 15 events!
**A:** Check your filters. Reset all to "Alle" and clear search.

### Q: Deep-link doesn't scroll!
**A:** Make sure the employee has the request in their detail page (from Prompt #2).

### Q: Unread counter not updating!
**A:** Refresh the page. It should show the current count.

### Q: Search shows nothing!
**A:** Check spelling. Try "Anna" or "urlaub" (lowercase).

---

## 🎓 Understanding the Features

### What is the Inbox?
A central place where admins see all incoming requests from employees. Think of it like an email inbox!

### Why Filter?
With many requests, filters help you focus:
- See only unread (new) requests
- See only vacation or day-off requests
- Find specific employees

### Why Toggle Read/Unread?
Mark events you've already handled as "read" so you know what's new!

### What's Deep-Linking?
Clicking "Öffnen" takes you directly to the right place:
- Right employee
- Right tab
- Right request
No manual searching needed!

---

## 🎯 Success Indicators

**You've tested everything successfully if:**

✅ All 15 events visible
✅ Search filters work
✅ All three filters work
✅ Filters combine correctly
✅ Sort order changes events
✅ Toggle read/unread works
✅ Unread counter updates
✅ "Öffnen" navigates correctly
✅ Correct tab opens on detail page
✅ Request is highlighted
✅ Mobile view looks good
✅ Empty state appears when appropriate

---

## 📚 Next Steps

After testing the inbox, explore:
1. **Integration with Employee Detail** - See how tabs and requests work
2. **Filter Combinations** - Try every possible combo
3. **Mobile UX** - Test on real device if possible

---

## 🎉 Enjoy!

The inbox is your **command center** for handling employee requests!

Search, filter, sort, and jump directly to any request with one click!

**Start testing now:** http://localhost:3000/admin/inbox 🚀

