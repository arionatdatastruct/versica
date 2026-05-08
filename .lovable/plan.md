## Aktueller Stand

OCR-Pipeline funktioniert: Klippa generic + Regex-Parser + LLM-Fallback. Police wird hochgeladen → analysiert → bestätigt.

**Was fehlt:** Im Dashboard siehst du zwar pro Mitglied die Policen, aber es gibt keine Möglichkeit, eine Police zu **löschen** oder **alle Policen aufzulisten** (z.B. fehlgeschlagene OCR, Duplikate, alte Versionen).

## Vorschlag für die nächsten Schritte

### 1. Police-Verwaltung im Dashboard (jetzt)

In jeder Mitglied-Karte pro Police:
- **Bearbeiten**-Button → öffnet `/police-bestaetigen/$policyId` mit den gespeicherten Werten
- **Löschen**-Button mit Bestätigungs-Dialog (AlertDialog) → löscht den Datenbankeintrag **und** die Datei aus dem `policy-uploads` Bucket

### 2. Eigene Übersichtsseite "Meine Policen" (`/policen`)

Eine Liste aller Policen des Users — auch solche **ohne member_id** oder mit `ocr_status = 'failed'/'processing'`, die im Dashboard heute unsichtbar sind. Pro Zeile:
- Versicherer, Nummer, Versicherte Person, Prämie, Status-Badge (Bestätigt / In Bearbeitung / Fehlgeschlagen / Entwurf)
- Aktionen: Öffnen, Bestätigen, Löschen
- Filter "Nur unbestätigte" und "Duplikate anzeigen" (gleiche policy_number ODER gleiche insurer + insured + valid_from)
- Optional: "Alle fehlgeschlagenen löschen" Bulk-Aktion

Link dazu im Header und Dashboard.

### 3. Duplikat-Erkennung beim Upload (später)

Beim Bestätigen prüfen, ob bereits eine Police mit gleicher `policy_number` (oder gleiche insurer + insured_first_name + insured_last_name + valid_from) existiert → Hinweis-Banner: *"Es existiert bereits eine ähnliche Police vom 12.05.2024. Ersetzen oder als neue Version speichern?"*

### 4. Weitere offene Themen (zur Auswahl für später)

- **Familien-Optimierung** mit echten Daten füttern (heute statisch?)
- **Beratung mit Versica** — Lovable AI Gateway anbinden, Kontext = alle Policen des Users
- **Vergleich** mit Marktpreisen (Datenquelle?)
- **Kündigungsschreiben** als PDF generieren
- **Empfehlungslink** funktional machen (Cashback-Tracking)

## Frage an dich

Soll ich mit **Schritt 1 + 2 zusammen** loslegen (Löschen + Bearbeiten überall + neue Übersichtsseite `/policen`)? Das ist die saubere Lösung für dein "alte Policen / Duplikate löschen" Anliegen. Schritt 3 und 4 dann separat.