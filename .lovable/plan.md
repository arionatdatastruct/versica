## Familienmitglieder hinzufügen & bearbeiten — Plan

Ziel: Der/die Haushaltsbesitzer:in kann alle Personen, für die Versica später Policen analysieren und optimieren soll, sauber pflegen. Das ist die Datenbasis für Familien-Optimierer (Komp. 08), Versicherungs-Doktor (Komp. 09) und alle 1:1-Vergleiche.

### Was muss gemäss Geschäftsidee abgedeckt sein

Aus der Doku (Komp. 02 Familien-Account, Komp. 08 Familien-Optimierer, Komp. 04 Bedarfsanalyse) braucht ein Mitglied mehr als nur "Vorname". Wir müssen genug Daten erfassen, damit später Prämien überhaupt berechnet werden können — Schweizer Krankenkassenprämien sind **alters-, geschlechts-, wohnort- und modellabhängig**.

### Felder pro Mitglied

Pflicht (Phase 1, jetzt):
- Vorname
- Geburtsdatum (statt Alter — bleibt ewig korrekt)
- Geschlecht (m / w / divers) — prämienrelevant
- Rolle: Erwachsene:r / Jugendliche:r / Kind (wird aus Geburtsdatum abgeleitet, aber sichtbar)
- "Das bin ich" Flag (`is_self`, max. 1 pro Haushalt)

Optional (jetzt schon Felder, später befüllt durch KI/Bedarfsanalyse):
- Nachname
- Wohn-PLZ + Kanton (für Prämienregion; meist gleich wie Haushalt, kann abweichen z. B. Studierende)
- Notizen / Gesundheitshinweise (Freitext, z. B. "Brille", "Zahnspange geplant")

Bewusst NICHT jetzt: detaillierte Bedarfsanalyse-Antworten (Hausarzt, Alternativmedizin, Spitalkomfort, Reisen) — die gehören in den KI-Berater-Flow (Phase 3) und werden separat in einer `member_preferences`-Tabelle gespeichert, sobald wir den KI-Berater bauen.

### User-Flows

1. **Liste auf `/dashboard`** (existiert) — bleibt; neuer Button "Mitglied hinzufügen".
2. **Eigene Seite `/familie`** — vollständige Verwaltung:
   - Tabelle/Karten aller Mitglieder mit Avatar-Initialen, Geburtsdatum, Anzahl Policen
   - Aktionen: Bearbeiten, Löschen (mit Bestätigung; blockiert wenn Policen verknüpft → Hinweis "zuerst Policen löschen oder umhängen")
   - "Mitglied hinzufügen" öffnet Dialog
3. **Dialog "Mitglied hinzufügen / bearbeiten"** (shadcn `Dialog` + `Form`):
   - Felder wie oben, Zod-Validierung
   - "Das bin ich" nur sichtbar wenn noch kein `is_self` existiert oder wir gerade dieses Mitglied bearbeiten
4. **Verknüpfung mit Police**: in `/police-bestaetigen/$policyId` Dropdown "Für wen ist diese Police?" — bestehende Mitglieder + Inline-Option "Neues Mitglied anlegen" (öffnet denselben Dialog).

### Datenbank-Anpassungen (Migration)

Tabelle `household_members` heute: `first_name, last_name, is_self, household_id`.

Neue Spalten:
- `birth_date date` (nullable für bestehende, neue Pflicht via App-Validierung)
- `gender text check (gender in ('female','male','other')) ` — als Validierungs-Trigger statt CHECK falls nötig, hier aber stabil → CHECK ok
- `postal_code text` (nullable)
- `canton text` (nullable, 2-Buchstaben)
- `notes text` (nullable)
- `created_at timestamptz default now()` falls fehlt
- `updated_at timestamptz default now()` + Trigger `touch_updated_at`

Plus: Partial-Unique-Index, damit pro Haushalt nur ein `is_self`:
```
create unique index uniq_self_per_household
on household_members(household_id) where is_self = true;
```

RLS bleibt wie sie ist (Owner-only über `is_household_owner`). Keine neuen Policies nötig.

### Code-Änderungen (Frontend)

Neue Dateien:
- `src/routes/_authenticated.familie.tsx` — Übersichtsseite
- `src/components/family/MemberFormDialog.tsx` — Dialog mit Form (react-hook-form + zod)
- `src/components/family/MemberCard.tsx` — Darstellung einer Person
- `src/lib/family.ts` — kleine Helper: `calculateAge(birthDate)`, `deriveRole(age)` (Kind <19, Jugend 19-25, Erwachsen 26+ — Schweizer KV-Logik)

Bestehende Dateien anpassen:
- `src/routes/_authenticated.dashboard.tsx` — "Mitglied hinzufügen"-Button + Link zu `/familie`
- `src/routes/_authenticated.police-bestaetigen.$policyId.tsx` — Mitglieder-Dropdown statt freiem Feld
- `src/components/Header.tsx` — Nav-Link "Familie"

Datenzugriff: Direkt via `supabase` Browser-Client (RLS schützt). Kein Server-Function nötig — passt zur aktuellen Architektur (Phase 1).

### Edge Cases / Entscheidungen

- **Löschen mit verknüpften Policen**: Soft-Block im UI + zusätzlich DB-Verhalten klären (siehe Frage 1).
- **`is_self` umhängen**: Erlaubt, aber nur eine Person darf das Flag haben (Index erzwingt das).
- **Kinder ohne eigene E-Mail**: kein Problem — `household_members` hat keinen `auth.users`-Bezug, ist nur ein Datensatz im Haushalt.
- **Sprachen DE/FR/IT/EN**: nur DE jetzt, Strings aber zentral halten für späteres i18n.

### Fragen vor Umsetzung

Siehe `ask_questions` im nächsten Schritt — vor allem zu Lösch-Verhalten, Wohnort-Pro-Mitglied und ob wir gleich die PLZ-/Kanton-Felder mit aufnehmen oder erst später.
