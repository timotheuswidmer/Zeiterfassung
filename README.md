# ⏱ Zeiterfassung — Einrichtungsanleitung

## Übersicht
Die App benötigt zwei Dinge:
1. **Supabase** — kostenlose Datenbank (Daten zentral, für alle Geräte)
2. **Vercel** — kostenloses Hosting (App im Browser erreichbar)

Gesamtzeit: ca. 20–30 Minuten

---

## TEIL 1 — Supabase einrichten

### Schritt 1 — Supabase Account erstellen
1. Gehe zu [supabase.com](https://supabase.com)
2. Klicke **"Start your project"** → **"Sign Up"**
3. Registriere dich (z.B. mit GitHub oder E-Mail)

### Schritt 2 — Neues Projekt erstellen
1. Klicke **"New project"**
2. Wähle eine Organisation (oder erstelle eine)
3. Fülle aus:
   - **Name:** `zeiterfassung`
   - **Database Password:** ein sicheres Passwort (merken!)
   - **Region:** `Central EU (Frankfurt)`
4. Klicke **"Create new project"** — warte ca. 1 Minute

### Schritt 3 — Datenbank-Tabellen anlegen
1. Im Supabase-Dashboard: klicke links auf **"SQL Editor"**
2. Klicke **"New query"**
3. Kopiere den folgenden SQL-Code komplett und füge ihn ein:

```sql
-- Benutzer
create table users (
  id bigint primary key generated always as identity,
  name text not null,
  username text not null unique,
  password text not null,
  role text not null default 'employee',
  created_at timestamptz default now()
);

-- Zeiteinträge
create table entries (
  id bigint primary key generated always as identity,
  date text not null,
  employee_id bigint references users(id) on delete cascade,
  employee_name text not null,
  project text not null,
  activity text not null,
  total_min integer not null,
  note text,
  created_at timestamptz default now()
);

-- Projekte
create table projects (
  id bigint primary key generated always as identity,
  name text not null unique
);

-- Tätigkeiten
create table activities (
  id bigint primary key generated always as identity,
  name text not null unique
);

-- Zugriff für die App erlauben (RLS deaktivieren für einfache Nutzung)
alter table users enable row level security;
alter table entries enable row level security;
alter table projects enable row level security;
alter table activities enable row level security;

create policy "allow all" on users for all using (true) with check (true);
create policy "allow all" on entries for all using (true) with check (true);
create policy "allow all" on projects for all using (true) with check (true);
create policy "allow all" on activities for all using (true) with check (true);

-- Demo-Daten einfügen
insert into users (name, username, password, role) values
  ('Admin', 'admin', 'admin123', 'admin'),
  ('Anna Müller', 'anna', 'anna123', 'employee'),
  ('Marco Rossi', 'marco', 'marco123', 'employee');

insert into projects (name) values
  ('Website Redesign'), ('Mobile App'), ('Buchhaltung'), ('Interne IT');

insert into activities (name) values
  ('Entwicklung'), ('Meeting'), ('Planung'), ('Design'), ('Testing'), ('Administration');
```

4. Klicke **"Run"** (▶ Play-Button oben rechts)
5. Es erscheint: `Success. No rows returned` — das ist korrekt ✅

### Schritt 4 — Zugangsdaten holen
1. Klicke links im Menü auf **"Project Settings"** (Zahnrad-Icon)
2. Klicke auf **"API"**
3. Du siehst zwei wichtige Werte — kopiere sie:
   - **Project URL** → sieht aus wie `https://abcdefgh.supabase.co`
   - **anon public** (unter "Project API keys") → langer Text der mit `eyJ` beginnt

---

## TEIL 2 — App konfigurieren

### Schritt 5 — Zugangsdaten eintragen
Öffne die Datei `src/App.jsx` in einem Texteditor (z.B. Notepad++, VS Code).

Suche die Zeilen 8–9 und ersetze die Platzhalter:

```javascript
// VORHER:
const SUPABASE_URL = "DEINE_SUPABASE_URL";
const SUPABASE_ANON_KEY = "DEIN_SUPABASE_ANON_KEY";

// NACHHER (Beispiel):
const SUPABASE_URL = "https://abcdefgh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

Speichere die Datei.

---

## TEIL 3 — App deployen (Vercel)

### Schritt 6 — GitHub Repository erstellen
1. Gehe zu [github.com](https://github.com) → Account erstellen (falls noch nicht vorhanden)
2. Klicke **"+"** → **"New repository"**
3. Name: `zeiterfassung` → **Public** → **"Create repository"**

### Schritt 7 — Dateien hochladen
1. Klicke auf **"uploading an existing file"**
2. Ziehe alle Dateien aus dem `zeiterfassung`-Ordner per Drag & Drop hinein:
   - `package.json`, `vite.config.js`, `index.html`, `vercel.json`
   - Ordner `src/` mit `App.jsx` und `main.jsx`
3. Klicke **"Commit changes"**

### Schritt 8 — Vercel deployen
1. Gehe zu [vercel.com](https://vercel.com) → **"Sign up with GitHub"**
2. Klicke **"Add New Project"** → wähle `zeiterfassung` → **"Import"**
3. Alles auf Standard lassen → **"Deploy"**
4. Nach ~1 Minute: deine URL ist fertig! z.B. `zeiterfassung-xyz.vercel.app`

---

## ✅ Fertig!

Alle Mitarbeitenden können jetzt über die URL einloggen — von jedem Gerät.

**Erste Schritte nach dem Einrichten:**
- Logge dich als `admin` / `admin123` ein
- Gehe zu **Verwaltung** → Benutzer → Passwörter ändern!
- Bestehende Demo-Benutzer (anna, marco) anpassen oder löschen

**📱 Als Handy-App speichern:**
- iPhone: Safari → Teilen-Symbol → "Zum Home-Bildschirm"
- Android: Chrome → Menü (⋮) → "Zum Startbildschirm hinzufügen"

---

## App aktualisieren (neue Funktionen)
1. Datei(en) in GitHub ersetzen (Upload → "Commit changes")
2. Vercel deployed automatisch innerhalb von ~1 Minute
3. **Daten in Supabase bleiben immer erhalten** ✅

## Support / Neue Anforderungen
Schicke einfach die aktuellen Dateien und beschreibe, was du möchtest.
