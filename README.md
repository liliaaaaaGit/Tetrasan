# Tetrasan Zeiterfassung

Eine interne Zeiterfassungs-WebApp für Tetrasan.

## 🚀 Schnellstart

### Installation

```bash
npm install
```

### Entwicklungsserver starten

```bash
npm run dev
```

Die App ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

## 📱 Navigation

### Mitarbeiter-Ansicht
- **Stunden**: Monatliche Übersicht der Arbeitsstunden (heute hervorgehoben)
- **Urlaub**: Urlaubsformular herunterladen/hochladen
- **Tagesbefreiung**: Tagesbefreiungsformular herunterladen/hochladen

### Admin-Ansicht
- **Mitarbeiter**: Liste aller Mitarbeiter mit Suche
- **Posteingang**: Benachrichtigungen über neue Anträge

## 🎨 Features

### Implementiert
✅ Next.js 14 mit App Router  
✅ TypeScript  
✅ Tailwind CSS  
✅ Mobile-First Design  
✅ Deutsche Lokalisierung (de-DE)  
✅ Responsive Navigation (Bottom-Tabs auf Mobil, Sidebar auf Desktop)  
✅ Cutoff/Approval Status Badge  
✅ Wiederverwendbare Komponenten  

### Noch zu implementieren
⏳ Supabase Integration  
⏳ Authentifizierung  
⏳ Row Level Security (RLS)  
⏳ Echte Datenbank-Logik  
⏳ Formular-Upload/Download  

## 📂 Projektstruktur

```
app/
├── (employee)/          # Mitarbeiter-Bereich
│   ├── employee/hours   # Stundenerfassung
│   ├── employee/leave   # Urlaubsanträge
│   └── employee/dayoff  # Tagesbefreiung
├── (admin)/             # Admin-Bereich
│   ├── admin/employees  # Mitarbeiterverwaltung
│   └── admin/inbox      # Posteingang
components/              # Wiederverwendbare UI-Komponenten
├── ui/                  # Base UI-Komponenten
├── page-header.tsx
├── empty-state.tsx
├── confirm-dialog.tsx
├── mobile-tabs.tsx
└── data-table.tsx
lib/
└── utils.ts             # Hilfsfunktionen
```

## 🎯 Komponenten-Übersicht

### Shared Components

- **PageHeader**: Seitentitel mit optionalem Action-Button
- **EmptyState**: Platzhalter für leere Listen
- **ConfirmDialog**: Bestätigungsdialog für Löschungen
- **MobileTabs**: Responsive Tabs (Akkordeon auf Mobil)
- **DataTable**: Wiederverwendbare Tabelle
- **Badge**: Status-Anzeiger für Cutoff/Approval

## 🔐 DSGVO-Konform

- Keine echten Nutzerdaten (nur Platzhalter)
- Keine Backend-Logik implementiert
- Bereit für sichere Supabase-Integration

## 📝 Entwickelt für

- **Zielgruppe**: Mitarbeiter einer Baufirma mit begrenzten Deutschkenntnissen
- **Design**: Einfach, minimalistisch, intuitiv
- **Sprache**: Einfaches Deutsch
- **Zeitzone**: Europe/Berlin

## 🛠️ Technologie-Stack

- **Framework**: Next.js 14
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge, class-variance-authority

## 📱 Mobile-First Ansatz

Die App ist primär für mobile Nutzung optimiert:
- Bottom Navigation für Mitarbeiter
- Touch-freundliche Buttons
- Responsive Design
- Akkordeon-Tabs auf kleinen Bildschirmen



