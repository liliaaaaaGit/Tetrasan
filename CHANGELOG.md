# 📋 Changelog - Tetrasan Zeiterfassung

## Prompt #2 - Admin Navigation, Dummy Data, Detail Tabs (Interactive)
**Date:** 2024-10-14
**Status:** ✅ Complete

### New Features

#### 1. Employee List Enhancements
- ✅ Expanded from 3 to **25 dummy employees**
- ✅ Client-side search/filter by name or email
- ✅ Employee count display with filter indicator
- ✅ Responsive table with status badges
- ✅ Click row to navigate to detail page

#### 2. Add Employee Modal
- ✅ Form with Name, E-Mail, Telefon, Aktiv fields
- ✅ Client-side validation (required fields, email format)
- ✅ Adds new employee to list (client state only)
- ✅ Cancel button and click-outside-to-close
- ✅ Form reset on save/cancel

#### 3. Interactive Employee Detail Page
- ✅ Employee info display (name, email, phone)
- ✅ Interactive Cutoff/Approval status toggle
  - Blue badge: "Monat offen"
  - Green badge: "Monat freigegeben"
  - Toggle button to switch states
- ✅ Info text about approval restrictions

#### 4. Tabbed Content System
- ✅ Desktop: Traditional tabs with underline indicator
- ✅ Mobile: Accordion-style expandable sections
- ✅ Three tabs: Stunden, Tagesbefreiung, Urlaub
- ✅ Smooth transitions and animations

#### 5. Hours Tab with Corrections
- ✅ 3 sample hours entries
- ✅ Columns: Datum, Von, Bis, Pause, Stunden, Hinweis
- ✅ Red correction stub component
  - Shows admin corrections visually
  - Displays corrected times and comments
  - Timestamp included
- ✅ Delete icon per entry

#### 6. Day-Off & Leave Request Tabs
- ✅ Day-off requests (2 entries with IDs)
- ✅ Leave requests (3 entries with IDs)
- ✅ Color-coded status badges:
  - eingereicht → Blue
  - genehmigt → Green
  - abgelehnt → Red
- ✅ Delete icons with confirmation
- ✅ Hash-anchor IDs for deep-linking

#### 7. Delete Confirmation Dialog
- ✅ Triggers when clicking trash icons
- ✅ German text: "Eintrag löschen?"
- ✅ Buttons: Abbrechen, Bestätigen
- ✅ UI-only (no actual deletion yet)
- ✅ Console logging for debugging

#### 8. Deep Linking Support
- ✅ Query parameter: `?focus=leave|dayoff|hours`
- ✅ Hash anchors: `#req-123`, `#h-1`
- ✅ Automatic tab activation
- ✅ Smooth scroll to element
- ✅ 2-second blue highlight ring
- ✅ Combined support: `?focus=leave#req-201`

#### 9. Empty States
- ✅ Contextual empty state messages
- ✅ Icons and friendly text
- ✅ Per-tab empty states

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| AddEmployeeDialog | `components/admin/employees/` | Modal for adding employees |
| EmployeesTable | `components/admin/employees/` | Reusable employee table |
| CorrectionStub | `components/admin/hours/` | Red admin correction display |

### New Utilities

| Utility | Path | Purpose |
|---------|------|---------|
| dummy-data.ts | `lib/` | 25 employees + sample data |
| deeplink.ts | `lib/` | URL parsing & scroll utilities |

### Updated Files

| File | Changes |
|------|---------|
| `app/(admin)/admin/employees/page.tsx` | Added search, modal, 25 employees |
| `app/(admin)/admin/employees/[id]/page.tsx` | Added tabs, toggle, deep-link, corrections |

### Documentation

| Document | Purpose |
|----------|---------|
| INTERACTIVE-FEATURES-GUIDE.md | Comprehensive testing guide |
| PROMPT-2-COMPLETE.md | Technical implementation docs |
| TEST-NOW.md | Quick test reference |
| CHANGELOG.md | This file |

### Technical Details

**TypeScript:**
- All components fully typed
- Interfaces for Employee, HoursEntry, Request
- Type-safe callbacks and props

**State Management:**
- Client-side React state
- No backend calls
- Local data only (resets on refresh)

**Accessibility:**
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus states visible
- Semantic HTML

**Responsive Design:**
- Mobile-first approach
- Tabs → Accordions on mobile
- Hidden columns on small screens
- Touch-friendly buttons

### Browser Support
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS/Android)

### Performance
- Client-side filtering (instant)
- No network requests
- Efficient state updates
- Smooth animations

---

## Prompt #1 - Project Setup & Navigation Skeleton
**Date:** 2024-10-14
**Status:** ✅ Complete

### Features Implemented
- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS + shadcn/ui
- ✅ German localization (de-DE)
- ✅ Mobile-first employee layout (bottom navigation)
- ✅ Admin layout (sidebar/top navigation)
- ✅ All page routes and placeholders
- ✅ Shared components:
  - PageHeader
  - ConfirmDialog
  - EmptyState
  - MobileTabs
  - DataTable
  - Badge
- ✅ Cutoff/Approval badge placeholder
- ✅ Complete documentation (README, ROUTES, etc.)

### Routes Created
- `/` → Redirects to `/employee/hours`
- `/employee/hours` - Hours tracking
- `/employee/leave` - Leave requests
- `/employee/dayoff` - Day-off requests
- `/admin/employees` - Employee management
- `/admin/employees/[id]` - Employee details
- `/admin/inbox` - Notifications

---

## Prompt #3 - Employee Monthly Calendar & Day Form (Mobile-First, UI-Only)
**Date:** 2024-10-14
**Status:** ✅ Complete

### New Features

#### 1. Monthly Calendar View
- ✅ Mobile-first calendar grid (Monday-Sunday start)
- ✅ Today highlighted with blue border and dot indicator
- ✅ Month navigation (previous/next arrows)
- ✅ "Heute" button to jump to current month
- ✅ Visual status indicators on days:
  - Green border + hours = Work day
  - Blue border = Vacation day
  - Red border = Sick day
- ✅ Color-coded legend
- ✅ Empty state message when no entries

#### 2. Day Entry Modal & Form
- ✅ Three status types: Arbeit, Urlaub, Krank
- ✅ Conditional form fields based on status:
  - Work: Von, Bis, Pause, Tätigkeitsbericht
  - Vacation/Sick: Kommentar
- ✅ Real-time hours calculation preview
- ✅ Comprehensive validation with German error messages
- ✅ Save/Cancel/Delete actions
- ✅ Inline delete confirmation (no global dialog)
- ✅ Success/delete toast notifications

#### 3. Monthly Summary Bar
- ✅ Total work hours (decimal, no rounding)
- ✅ Vacation days count
- ✅ Sick days count
- ✅ Live updates as entries change
- ✅ Export rounding hint

#### 4. Deep Linking Support
- ✅ `?month=YYYY-MM` - Jump to specific month
- ✅ `#YYYY-MM-DD` - Highlight and scroll to specific day
- ✅ Pulse effect on hash target
- ✅ URL sync with month navigation

#### 5. Client-Side State Management
- ✅ Entries keyed by ISO date (YYYY-MM-DD)
- ✅ Create/Read/Update/Delete operations
- ✅ Monthly summary calculations
- ✅ No persistence (resets on refresh)

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| DayEntryDialog | `components/employee/hours/` | Modal wrapper for day entry |
| DayEntryForm | `components/employee/hours/` | Form with validation logic |

### New Utilities

| Utility | Path | Purpose |
|---------|------|---------|
| date-utils.ts | `lib/` | Date calculations, formatting, calendar grid |
| useMonthState.ts | `components/employee/hours/` | Month navigation hook |
| dateAnchors.ts | `components/employee/hours/` | Hash anchor scrolling |
| types.ts | `components/employee/hours/` | TypeScript interfaces |

### Updated Files

| File | Changes |
|------|---------|
| `app/(employee)/employee/hours/page.tsx` | Complete rewrite with calendar grid, summary, state management |

### Technical Details

**Date Calculations:**
- Hours formula: `(End - Start) - Pause`
- No rounding in UI (only hint about 0.25h on export)
- German date format: DD.MM.YYYY
- German decimal separator: comma (8,25 not 8.25)

**Validation Rules:**
- End time > Start time
- Pause >= 0
- Calculated hours >= 0
- Required fields depend on status

**Localization:**
- All labels in simple German
- Month names: Januar, Februar, März...
- Weekdays: Mo, Di, Mi, Do, Fr, Sa, So
- Error messages in German

**Accessibility:**
- Large touch targets for mobile
- Keyboard navigation
- Focus states visible
- Semantic HTML

---

## Prompt #4 - Admin Inbox (Dummy Events, Filters, Deep-Links, UI-Only)
**Date:** 2024-10-14
**Status:** ✅ Complete

### New Features

#### 1. Admin Inbox Page
- ✅ "Postfach" page with subtitle
- ✅ Unread counter badge (top-right)
- ✅ 15 dummy inbox events
- ✅ Event types: Leave requests & Day-off requests
- ✅ Mixed read/unread status
- ✅ Timestamps (Oct 5-14, 2024)

#### 2. Search Functionality
- ✅ Search by employee name
- ✅ Search by event type ("urlaub", "tagesbefreiung")
- ✅ Case-insensitive matching
- ✅ Real-time filtering
- ✅ Results counter

#### 3. Filter System
- ✅ Status filter: Alle / Ungelesen / Gelesen
- ✅ Type filter: Alle / Urlaub / Tagesbefreiung
- ✅ Sort order: Neueste zuerst / Älteste zuerst
- ✅ Filters combine with AND logic
- ✅ All work together with search

#### 4. Event Display
- ✅ Desktop: Full table with columns
- ✅ Mobile: Card layout (responsive)
- ✅ Columns: Datum, Mitarbeiter, Typ, Status, Gelesen, Aktionen
- ✅ Date format: DD.MM.YYYY, HH:mm
- ✅ Color-coded badges
- ✅ Unread row highlighting (blue background)

#### 5. Read/Unread Toggle
- ✅ Eye icon buttons
- ✅ Toggle read status
- ✅ Badge updates instantly
- ✅ Background color changes
- ✅ Unread counter updates
- ✅ Client-side state management

#### 6. Deep-Link Navigation
- ✅ "Öffnen" button on each event
- ✅ Navigates to employee detail page
- ✅ Includes `?focus` query parameter
- ✅ Includes `#req-XXX` hash anchor
- ✅ Automatically activates correct tab
- ✅ Automatically scrolls to request
- ✅ Works with existing employee detail page

#### 7. Empty State
- ✅ Shows when no results match filters
- ✅ Inbox icon
- ✅ Message: "Keine Einträge gefunden"

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| InboxFilters | `components/admin/inbox/` | Search + filter controls |
| InboxTable | `components/admin/inbox/` | Event table/cards |

### New Utilities

| Utility | Path | Purpose |
|---------|------|---------|
| inbox-data.ts | `lib/` | 15 dummy events + helpers |
| useInboxState.ts | `components/admin/inbox/` | State management hook |

### Updated Files

| File | Changes |
|------|---------|
| `app/(admin)/admin/inbox/page.tsx` | Complete rewrite with full inbox functionality |

### Technical Details

**Deep-Link Format:**
- Leave: `/admin/employees/[id]?focus=leave#req-[requestId]`
- Day-off: `/admin/employees/[id]?focus=dayoff#req-[requestId]`

**Filter Logic:**
- Multiple filters combine with AND
- Search matches name OR type text
- Sorting applies after filtering
- All optimized with useMemo

**Badge Colors:**
- Urlaubsantrag: Blue (primary)
- Tagesbefreiung: Gray (secondary)
- Ungelesen: Blue (primary)
- Gelesen: Gray (secondary)
- eingereicht: Outline

**Accessibility:**
- ARIA labels on search and buttons
- Keyboard-accessible dropdowns
- Focus states visible
- Row highlighting doesn't rely on color alone

---

## Prompt #5 - Auth UI (Login/Signup), Allow-List Flow (UI-Only)
**Date:** 2024-10-14
**Status:** ✅ Complete

### New Features

#### 1. Authentication UI
- ✅ Login page (`/login`)
- ✅ Signup page (`/signup`)
- ✅ Logout page (`/logout`)
- ✅ Forgot password stub (`/forgot-password`)
- ✅ Privacy policy stub (`/datenschutz`)
- ✅ Imprint stub (`/impressum`)

#### 2. Auth Layout
- ✅ Minimal, centered design
- ✅ Neutral background
- ✅ "Zurück" link to home
- ✅ Logo/brand header
- ✅ Form card with shadow
- ✅ Legal links (Datenschutz, Impressum)

#### 3. Login Form
- ✅ Email and password fields
- ✅ "Passwort vergessen?" link
- ✅ "Konto erstellen" link
- ✅ Loading state with spinner
- ✅ Success toast
- ✅ Redirect to `/employee/hours`
- ✅ Neutral error messages

#### 4. Signup Form
- ✅ Email, password, password confirmation
- ✅ Info box about allow-list
- ✅ Password strength check (min 8 chars)
- ✅ Password match validation
- ✅ "Zur Anmeldung" link
- ✅ Loading state with spinner
- ✅ Success toast
- ✅ Redirect to `/employee/hours`

#### 5. Allow-List System
- ✅ 10 pre-approved employee emails
- ✅ `isEmailAllowed()` helper function
- ✅ Prevents unauthorized signups
- ✅ Neutral errors (no user enumeration)
- ✅ Security best practice

#### 6. Auth State Management
- ✅ Zustand for state management
- ✅ localStorage persistence
- ✅ `useAuthMock` hook
- ✅ Login function
- ✅ Signup function
- ✅ Logout function
- ✅ Simulated network delay
- ✅ Neutral error messages

#### 7. Navigation Integration
- ✅ Top utility bar on employee layout
- ✅ Shows user email when logged in
- ✅ "Abmelden" link when authenticated
- ✅ "Anmelden" link when not authenticated
- ✅ Desktop only (hidden on mobile)

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| LoginForm | `components/auth/` | Email + password login |
| SignupForm | `components/auth/` | Registration with validation |

### New Utilities

| Utility | Path | Purpose |
|---------|------|---------|
| allowlist.ts | `components/auth/` | Email allow-list + check function |
| useAuthMock.ts | `components/auth/` | Client-side auth state (Zustand) |

### New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| zustand | ^4.5.0 | State management with persistence |

### Updated Files

| File | Changes |
|------|---------|
| `app/(employee)/layout.tsx` | Added auth status bar with login/logout links |
| `package.json` | Added zustand dependency |

### Technical Details

**Validation:**
- Email format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Password min length: 8 characters
- Password confirmation must match
- Allow-list check on signup

**Error Messages (Neutral):**
- Login fail: "Anmeldung nicht möglich. Bitte Angaben prüfen."
- Signup not allowed: "Registrierung nicht möglich. Bitte wende dich an die Verwaltung."
- No indication whether email exists (security)

**State Persistence:**
- Zustand store with localStorage
- Key: `auth-mock-storage`
- Survives page refresh

**Allowed Emails:**
```
max@tetrasan.de, anna@tetrasan.de, thomas@tetrasan.de,
julia@tetrasan.de, michael@tetrasan.de, laura@tetrasan.de,
daniel@tetrasan.de, sophie@tetrasan.de, lukas@tetrasan.de,
emma@tetrasan.de
```

**Accessibility:**
- Proper label elements
- ARIA attributes
- Keyboard navigation
- Focus states visible
- Error messages with role="alert"
- Touch-friendly buttons

---

## Prompt #6 - Supabase Auth Integration (Allow-List Signup, Route Guards)
**Date:** 2024-10-14
**Status:** ✅ Complete

### New Features

#### 1. Supabase Integration
- ✅ SSR client with cookie-based sessions
- ✅ Browser client for Client Components
- ✅ Admin client (service role) - server-only
- ✅ Security guard prevents admin client in browser
- ✅ Environment variables for credentials
- ✅ Setup documentation

#### 2. Server-Side Signup
- ✅ API route `/api/auth/signup`
- ✅ Allow-list checking (mock or database)
- ✅ Creates users via `auth.admin.createUser`
- ✅ Auto-confirms email
- ✅ Neutral error messages (no user enumeration)
- ✅ Service role key stays on server

#### 3. Real Login
- ✅ `signInWithPassword` via Supabase
- ✅ Session stored in HTTP-only cookies
- ✅ Neutral errors on failure
- ✅ Automatic redirect after login
- ✅ Role-based routing (foundation)

#### 4. Real Logout
- ✅ `signOut()` via Supabase
- ✅ Loading state during logout
- ✅ Confirmation screen
- ✅ Session cleared

#### 5. Route Protection (Middleware)
- ✅ Protects `/employee/*` routes
- ✅ Protects `/admin/*` routes
- ✅ Redirects to `/login` if not authenticated
- ✅ Refreshes session on each request
- ✅ Redirects logged-in users from auth pages

#### 6. Session Management
- ✅ `getSession()` - Get current session
- ✅ `getProfile()` - Get user profile (mock)
- ✅ `requireSession()` - Require auth (redirect if not)
- ✅ `requireRole()` - Require specific role
- ✅ HTTP-only cookies (GDPR-compliant)

#### 7. Mock Fallback
- ✅ `ALLOWLIST_MOCK=true` uses in-memory list
- ✅ `ALLOWLIST_MOCK=false` checks database (TODO)
- ✅ Smooth transition to real database
- ✅ Clear TODOs in code

### New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/ssr | ^0.0.10 | Server-side rendering support |
| @supabase/supabase-js | ^2.39.0 | Supabase client library |

### New Files

| File | Purpose |
|------|---------|
| `lib/supabase/server.ts` | SSR client (cookies) |
| `lib/supabase/client.ts` | Browser client |
| `lib/supabase/admin.ts` | Admin client (service role) |
| `lib/auth/session.ts` | Session helpers |
| `lib/auth/redirects.ts` | Role-based routing |
| `app/api/auth/signup/route.ts` | Server signup endpoint |
| `middleware.ts` | Route protection |
| `SUPABASE-SETUP.md` | Setup instructions |
| `SUPABASE-AUTH-TEST-GUIDE.md` | Testing guide |

### Updated Files

| File | Changes |
|------|---------|
| `components/auth/LoginForm.tsx` | Real Supabase login |
| `components/auth/SignupForm.tsx` | Calls API endpoint |
| `app/(auth)/logout/page.tsx` | Real Supabase logout |
| `app/(employee)/layout.tsx` | Real auth state |
| `package.json` | Added Supabase deps |

### Removed Dependencies

| Package | Reason |
|---------|--------|
| (none) | Zustand kept for potential future use |

**Note:** `useAuthMock` from Prompt #5 is replaced but not deleted (can be removed later)

### Technical Details

**Security:**
- Service role key server-only (throws error if imported in browser)
- HTTP-only cookies (can't be accessed by JavaScript)
- Neutral error messages (no user enumeration)
- CORS same-origin only
- No sensitive data in logs

**Allow-List:**
- Mock mode: Uses in-memory list (10 emails)
- Database mode: Queries profiles table (TODO)
- Controlled by `ALLOWLIST_MOCK` env var

**Session Storage:**
- HTTP-only cookies (secure)
- Auto-refresh on each request
- GDPR-compliant (EU region)
- No localStorage (more secure)

**Route Protection:**
- Middleware checks every request
- Redirects before page load
- No client-side bypass possible
- Role checking (TODO when profiles table exists)

**Error Messages:**
- "Anmeldung nicht möglich. Bitte Angaben prüfen."
- "Registrierung nicht möglich. Bitte wende dich an die Verwaltung."
- All errors in German
- No indication of email existence
- No password hints

### TODOs (When Profiles Table Exists)

- [ ] Implement database check in `checkAllowList()`
- [ ] Implement real `getProfile()` query
- [ ] Enable role checking in middleware
- [ ] Set `ALLOWLIST_MOCK=false`
- [ ] Add Row Level Security policies
- [ ] Remove mock profile data

---

## Prompt #7 - Supabase Schema, RLS, Storage Policies (Migrations + Verification)
**Date:** 2024-12-14
**Status:** ✅ Complete

### New Features

#### 1. Core Database Schema
- ✅ Complete table structure (6 tables)
- ✅ Enums for roles, statuses, types
- ✅ Constraints and validation rules
- ✅ Indexes for performance
- ✅ Triggers for auto-updates
- ✅ Helper functions (is_admin, is_owner, is_month_open)

#### 2. Row Level Security (RLS)
- ✅ RLS enabled on all tables
- ✅ Employee vs admin access controls
- ✅ Month lock functionality
- ✅ Owner-based data isolation
- ✅ Admin-only operations (corrections, inbox)

#### 3. Storage System
- ✅ 2 storage buckets (templates, uploads)
- ✅ File access controls
- ✅ Employee-specific upload paths
- ✅ MIME type restrictions
- ✅ Size limits (10MB templates, 50MB uploads)

#### 4. Monthly Cutoff System
- ✅ timesheet_months table
- ✅ Open/approved status tracking
- ✅ Employee write restrictions on approved months
- ✅ Admin correction capabilities
- ✅ Audit trail for approvals

#### 5. Verification & Testing
- ✅ Comprehensive test suite
- ✅ RLS policy verification
- ✅ Constraint validation tests
- ✅ Storage access tests
- ✅ Month lock functionality tests

#### 6. Seed Data
- ✅ Local development data
- ✅ 1 admin + 5 employees
- ✅ Sample timesheet entries
- ✅ Sample leave requests
- ✅ Sample inbox events
- ✅ Sample corrections (red blocks)

### Database Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `profiles` | User directory & roles | Invite-only signup, role-based access |
| `timesheet_entries` | Daily time entries | Work/vacation/sick, auto-calculated hours |
| `timesheet_corrections` | Admin corrections | Red blocks, audit trail |
| `leave_requests` | Vacation/day-off | Status workflow, approval process |
| `inbox_events` | Admin notifications | Real-time alerts, read/unread |
| `timesheet_months` | Monthly cutoff | Open/approved status, lock mechanism |

### Storage Buckets

| Bucket | Purpose | Access Control |
|--------|---------|----------------|
| `forms-templates` | Template files | Public read, admin write |
| `forms-uploads` | Employee uploads | Private, employee-specific prefixes |

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20241214_init_core.sql` | Core schema, tables, RLS policies |
| `supabase/migrations/20241214_storage_policies.sql` | Storage buckets & policies |
| `supabase/migrations/20241214_seed_local.sql` | Local development seed data |
| `supabase/tests/verification.sql` | RLS and constraint tests |
| `README_DB.md` | Database setup and testing guide |
| `PROMPT-7-COMPLETE.md` | Technical documentation |

### Security Features

**Row Level Security:**
- Employees see only own data
- Admins see all data
- Month lock prevents employee writes
- Admin corrections always allowed
- File access by ownership

**Data Protection:**
- GDPR-compliant (EU region)
- No broad USING true policies
- Explicit owner vs admin checks
- Helper functions for security
- Audit trails for changes

**Storage Security:**
- Employee-specific upload paths
- Admin-only template management
- MIME type validation
- Size limits enforced
- RLS policies on storage

### Technical Details

**Constraints:**
- Time order validation (time_to > time_from)
- Break minutes >= 0
- Conditional required fields (work activity, vacation comment)
- Unique constraints (employee_id, year, month)
- Check constraints for data integrity

**Indexes:**
- profiles(email) unique
- timesheet_entries(employee_id, date)
- timesheet_corrections(entry_id, created_at)
- leave_requests(employee_id, created_at)
- inbox_events(created_at)
- timesheet_months(employee_id, year, month) unique

**Helper Functions:**
- `is_admin()` - Check if current user is admin
- `is_owner(profile_id)` - Check if current user owns profile
- `is_month_open(emp_id, year, month)` - Check if month is open

**Triggers:**
- Auto-update `updated_at` on profiles and timesheet_entries
- Timestamp management

### Seed Data

**Profiles:**
- 1 admin: admin@tetrasan.de
- 5 employees: max@tetrasan.de, anna@tetrasan.de, thomas@tetrasan.de, julia@tetrasan.de, michael@tetrasan.de

**Sample Data:**
- 6+ timesheet entries (work, vacation, sick)
- 3 leave requests (vacation, day-off)
- 3 inbox events (notifications)
- 1 correction (red block example)
- Current month open for all employees

### Testing

**Verification Tests:**
- RLS policy enforcement
- Month lock functionality
- Constraint validation
- Storage access controls
- Admin vs employee permissions
- Helper function behavior

**Test Coverage:**
- ✅ Employee can see only own data
- ✅ Admin can see all data
- ✅ Month approval blocks employee writes
- ✅ Admin can add corrections to locked months
- ✅ Storage policies enforce ownership
- ✅ Constraints prevent invalid data

### Setup Instructions

**Local Development:**
```bash
supabase init
supabase start
supabase db reset
psql -f supabase/tests/verification.sql
```

**Production:**
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWLIST_MOCK=false  # Use real database
```

### Important Notes

**Profile ID Management:**
- profiles.id updated to auth.uid() after signup
- Do not reference profiles.id externally until signup complete
- Invite-only flow: admins pre-create profiles

**Month Lock Behavior:**
- Default: months open if no timesheet_months record
- Locked: when status = 'approved', employees lose write access
- Corrections: admins can always add corrections

**Storage Paths:**
- Templates: forms-templates/vacation_template.pdf
- Uploads: forms-uploads/{employee_id}/YYYY/MM/{uuid}.pdf

### TODOs (Next Steps)

- [ ] Update signup flow to set profiles.id = auth.uid()
- [ ] Connect timesheet entries to database
- [ ] Implement leave request submission
- [ ] Add file upload functionality
- [ ] Connect admin inbox to real events
- [ ] Add production monitoring
- [ ] Configure backup strategy

---

## Next Steps (Prompt #8 - Future)

### Planned Features
- [ ] Supabase integration
- [ ] Authentication (employee vs admin)
- [ ] Real database CRUD operations
- [ ] Row Level Security (RLS)
- [ ] File upload for leave/day-off forms
- [ ] Actual approval workflow
- [ ] Email notifications
- [ ] PWA support (offline mode)
- [ ] Export to PDF/Excel
- [ ] Multi-shift entries per day
- [ ] Automatic 0.25h rounding option

---

## Statistics

**Total Files Created:** ~30
**Total Lines of Code:** ~2,500+
**Components:** 12
**Pages:** 7
**Dummy Employees:** 25
**Languages:** TypeScript, TSX, CSS
**Documentation Pages:** 6

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.2.0 | 2024-10-14 | Interactive admin features |
| 0.1.0 | 2024-10-14 | Initial project setup |

---

## Credits

**Framework:** Next.js 14
**UI Library:** shadcn/ui + Tailwind CSS
**Icons:** Lucide React
**Language:** TypeScript
**Deployment:** Ready for Vercel

---

## License

Internal use only - Tetrasan Construction Company

