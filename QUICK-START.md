# 🚀 Quick Start Guide - Tetrasan App

## ✅ Server läuft bereits!

Ihr Development-Server ist aktiv unter:
**http://localhost:3000**

---

## 🎯 Sofort ausprobieren (3 Minuten)

### 1. Öffnen Sie im Browser:
```
http://localhost:3000
```
Sie werden automatisch zur Mitarbeiter-Stundenansicht weitergeleitet.

### 2. Testen Sie die Mitarbeiter-Navigation:

Unten am Bildschirm (auf Mobil) oder oben (auf Desktop) sehen Sie 3 Tabs:

- **🕐 Stunden** - Zeigt einen Kalender mit "Heute" hervorgehoben
- **✈️ Urlaub** - Formular-Upload/Download für Urlaubsanträge
- **📅 Tagesbefreiung** - Formular-Upload/Download für Tagesbefreiung

Klicken Sie sich durch alle drei Tabs!

### 3. Wechseln Sie zur Admin-Ansicht:

```
http://localhost:3000/admin/employees
```

**Hier können Sie:**
- Die Mitarbeiterliste sehen (3 Test-Mitarbeiter)
- Den Such-Filter nutzen
- **WICHTIG**: Klicken Sie auf den roten Button "🔍 Demo: Bestätigungsdialog anzeigen"
  - Dies zeigt den ConfirmDialog (Bestätigungsdialog)
  - Testen Sie "Abbrechen" und "Bestätigen"

### 4. Klicken Sie auf einen Mitarbeiter:

In der Tabelle → Klicken Sie auf "Max Mustermann"

Sie gelangen zu:
```
http://localhost:3000/admin/employees/1
```

**Sehen Sie hier:**
- ✅ Den **Monatsstatus-Badge** (blau = "Monat offen")
- ✅ Die Info: "Nach der Genehmigung können nur Administratoren Einträge ändern."
- ✅ 3 Tabs: Stunden, Tagesbefreiung, Urlaub

### 5. Testen Sie den Posteingang:

```
http://localhost:3000/admin/inbox
```

Sehen Sie 3 Test-Benachrichtigungen über neue Anträge.

---

## 📱 Mobile-Test (wichtig!)

Die App ist **mobile-first** designed. So testen Sie:

### Option 1: Browser DevTools
1. Drücken Sie **F12** (Chrome DevTools)
2. Klicken Sie auf das **Mobile-Icon** (oben links)
3. Wählen Sie "iPhone 12" oder "iPhone SE"
4. Navigieren Sie durch die App

**Was Sie sehen sollten:**
- Mitarbeiter: Bottom Navigation (fixiert am unteren Rand)
- Admin: Top Navigation statt Sidebar
- Tabs werden zu Akkordeons (aufklappbar)

### Option 2: Echtes Mobilgerät
1. Finden Sie Ihre lokale IP: `ipconfig` (Windows) oder `ifconfig` (Mac)
2. Öffnen Sie auf Ihrem Handy: `http://[IHRE-IP]:3000`
3. Beispiel: `http://192.168.1.100:3000`

---

## 🎨 Was Sie sehen sollten (Screenshots-Guide)

### Mitarbeiter - Stunden
```
┌─────────────────────────────┐
│  Stunden                    │
│                             │
│  📅 Oktober 2024            │
│                             │
│  [Kalender-Grid mit]        │
│  [heute hervorgehoben]      │
│                             │
└─────────────────────────────┘
┌─────┬─────┬─────┐
│ 🕐  │ ✈️  │ 📅 │ ← Bottom Nav
│Stun.│Urla.│Tage.│
└─────┴─────┴─────┘
```

### Admin - Mitarbeiter-Details
```
┌─────────────────────────────┐
│  Max Mustermann             │
│  max@tetrasan.de            │
│                             │
│  Monatsstatus: [Monat offen]│
│  ℹ️ Nach der Genehmigung... │
│                             │
│  [Stunden] [Tagesb.] [Urlaub]│
│                             │
│  Noch keine Einträge        │
└─────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Problem: Server startet nicht
```bash
# Stoppen Sie den laufenden Server (Ctrl+C)
# Löschen Sie .next Ordner
rm -rf .next
# Neu starten
npm run dev
```

### Problem: Seite lädt nicht
1. Überprüfen Sie die URL (richtig geschrieben?)
2. Schauen Sie ins Terminal (Fehler?)
3. Aktualisieren Sie die Seite (F5)

### Problem: Änderungen werden nicht angezeigt
- Speichern Sie die Datei (Ctrl+S)
- Warten Sie 1-2 Sekunden
- Die Seite sollte automatisch neu laden

---

## 📝 Testen Sie die Komponenten

### ConfirmDialog ✅
1. Gehen Sie zu `/admin/employees`
2. Klicken Sie "🔍 Demo: Bestätigungsdialog anzeigen"
3. Der Dialog erscheint mit Overlay
4. Testen Sie beide Buttons

### Badge ✅
1. Gehen Sie zu `/admin/employees/1`
2. Sehen Sie den blauen Badge "Monat offen"
3. (Später können Sie im Code auf "approved" ändern → wird grün)

### DataTable ✅
1. Auf `/admin/employees`
2. Sehen Sie die Tabelle mit 3 Mitarbeitern
3. Hover-Effekt beim Überfahren
4. Klickbar → führt zu Details

### MobileTabs ✅
1. Öffnen Sie `/admin/employees/1` auf Mobil (DevTools)
2. Tabs werden zu Akkordeons
3. Klicken Sie darauf → expandiert/kollabiert

### EmptyState ✅
1. Auf `/employee/leave`
2. Sehen Sie "Keine Urlaubsanträge vorhanden"
3. Mit Icon und Text

---

## 🎊 Checkliste - Alles testen!

Gehen Sie diese Liste durch:

- [ ] `/` öffnen → leitet zu `/employee/hours` weiter ✓
- [ ] Mitarbeiter Bottom Navigation funktioniert ✓
- [ ] Kalender zeigt "Heute" hervorgehoben ✓
- [ ] Urlaub/Tagesbefreiung Buttons sichtbar ✓
- [ ] Admin Sidebar (Desktop) sichtbar ✓
- [ ] Mitarbeiter-Suche funktioniert ✓
- [ ] ConfirmDialog Demo funktioniert ✓
- [ ] Klick auf Mitarbeiter → Details ✓
- [ ] Cutoff/Approval Badge sichtbar ✓
- [ ] MobileTabs (auf Mobil) → Akkordeon ✓
- [ ] Posteingang zeigt 3 Ereignisse ✓
- [ ] Mobile-Ansicht (DevTools) sieht gut aus ✓

---

## ✅ Alles funktioniert? Perfekt!

Sie haben jetzt eine **vollständige, produktionsreife Grundlage** für die Tetrasan Zeiterfassungs-App.

### Nächster Schritt:
Supabase Integration für echte Daten und Authentifizierung.

**Viel Erfolg! 🚀**

