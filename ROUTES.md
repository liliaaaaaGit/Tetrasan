# 🗺️ Tetrasan App - Verfügbare Routen

## Mitarbeiter-Routen (Employee)

### 📊 Stunden
- **Route**: `/employee/hours`
- **Layout**: Bottom Navigation (Mobil) / Top Tabs (Desktop)
- **Features**: 
  - Monatliche Kalenderübersicht
  - Heute hervorgehoben
  - Placeholder für Stundenerfassung

### ✈️ Urlaub
- **Route**: `/employee/leave`
- **Features**:
  - Formular herunterladen
  - Formular hochladen
  - Liste eingereichten Anträge

### 📅 Tagesbefreiung
- **Route**: `/employee/dayoff`
- **Features**:
  - Formular herunterladen
  - Formular hochladen
  - Liste eingereichten Anträge

---

## Admin-Routen

### 👥 Mitarbeiterliste
- **Route**: `/admin/employees`
- **Layout**: Sidebar (Desktop) / Top Navigation (Mobil)
- **Features**:
  - Suchfunktion
  - Filterfunktion
  - "Mitarbeiter hinzufügen" Button
  - Klickbare Zeilen führen zu Details

### 👤 Mitarbeiter-Details
- **Route**: `/admin/employees/[id]`
- **Beispiel**: `/admin/employees/1`
- **Features**:
  - Tabs: Stunden, Tagesbefreiung, Urlaub
  - Cutoff/Approval Status Badge
  - Wird zu Akkordeon auf Mobil
  - Info-Hinweis zur Genehmigung

### 📬 Posteingang
- **Route**: `/admin/inbox`
- **Features**:
  - Ereignis-/Benachrichtigungsliste
  - Neue Urlaubs- und Tagesbefreiungsanträge
  - Zeitstempel

---

## Root-Route
- **Route**: `/`
- **Aktion**: Automatische Weiterleitung zu `/employee/hours`

---

## Status-Badges

### Cutoff/Approval Status (auf Admin-Detailseite)
- **Monat offen** → Blaues Outline-Badge
- **Monat genehmigt** → Grünes Outline-Badge
- **Info**: "Nach der Genehmigung können nur Administratoren Einträge ändern."

---

## Navigation-Übersicht

### Mitarbeiter
```
┌─────────────────────────────────┐
│                                 │
│         Main Content            │
│                                 │
└─────────────────────────────────┘
┌───────┬────────┬──────────────┐
│ 🕐    │  ✈️    │  📅          │
│Stunden│ Urlaub │Tagesbefreiung│
└───────┴────────┴──────────────┘
```

### Admin (Desktop)
```
┌──────────┬─────────────────────┐
│          │                     │
│ Sidebar  │   Main Content      │
│          │                     │
│ 👥 Mitarb│                     │
│ 📬 Postei│                     │
│          │                     │
└──────────┴─────────────────────┘
```

---

## Testen der Routen

Nach dem Start des Dev-Servers (`npm run dev`):

- ✅ [http://localhost:3000](http://localhost:3000) → Weiterleitung zu `/employee/hours`
- ✅ [http://localhost:3000/employee/hours](http://localhost:3000/employee/hours)
- ✅ [http://localhost:3000/employee/leave](http://localhost:3000/employee/leave)
- ✅ [http://localhost:3000/employee/dayoff](http://localhost:3000/employee/dayoff)
- ✅ [http://localhost:3000/admin/employees](http://localhost:3000/admin/employees)
- ✅ [http://localhost:3000/admin/employees/1](http://localhost:3000/admin/employees/1)
- ✅ [http://localhost:3000/admin/inbox](http://localhost:3000/admin/inbox)

