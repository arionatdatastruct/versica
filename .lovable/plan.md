## Ziel

Storage bleibt bestehen (Originale werden gebraucht für Re-OCR, Versica-Quellenangaben und das User-Versprechen "jederzeit verfügbar"). Stattdessen:

1. **Neue Detail-Seite `/policen/$policyId`** mit Split-View — PDF links, Felder rechts. Nur einsehen, kein Bearbeiten (zum Bearbeiten weiterhin `/police-bestaetigen/$policyId`).
2. **Cron-Job** der nur *verwaiste* Storage-Objekte löscht (Dateien ohne zugehörige `policies`-Zeile, z.B. nach abgebrochenen Uploads).

## Schritt 1 — Detail-Seite `/policen/$policyId`

Neue Route `src/routes/_authenticated.policen.$policyId.tsx`:

```text
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├──────────────────────────┬──────────────────────────────────┤
│                          │  CSS Hausarzt    [Bestätigt]     │
│                          │  Maria Muster · Nr. 12345        │
│                          │                                  │
│   PDF-Vorschau           │  ── Police-Info ──               │
│   (eingebettetes <iframe>│  Versicherer    CSS              │
│    auf signed URL)       │  Modell         Hausarzt         │
│                          │  Franchise      CHF 2'500        │
│                          │  Gültig         01.01.2026 →     │
│                          │                                  │
│                          │  ── KVG ──                       │
│                          │  Monatsprämie   CHF 412.50       │
│                          │  Unfall         eingeschlossen   │
│                          │                                  │
│                          │  ── VVG ──                       │
│                          │  Spital halbpriv. CHF 89.00      │
│                          │  Zahn             CHF 24.50      │
│                          │                                  │
│                          │  Total/Mt.      CHF 526.00       │
│                          │                                  │
│                          │  [Bearbeiten] [PDF öffnen] [🗑]  │
└──────────────────────────┴──────────────────────────────────┘
```

**Technisch:**
- PDF via `supabase.storage.from('policy-uploads').createSignedUrl(file_path, 3600)` — Bucket bleibt privat.
- `<iframe src={signedUrl}>` für PDFs; bei Bildern (jpg/png/heic) `<img>`. HEIC zeigt Fallback "Vorschau nicht verfügbar — PDF/JPG empfohlen".
- Layout: `grid lg:grid-cols-[1.2fr_1fr]`, sticky PDF-Pane, Details scrollbar.
- Mobile: gestapelt (PDF oben, Details unten).
- Buttons: **Bearbeiten** → `/police-bestaetigen/$policyId`, **PDF öffnen** (signed URL in neuem Tab), **Löschen** (Dialog → zurück nach `/policen`).

**Verlinkung:**
- In `/policen` wird der Versicherer-Name (oder die ganze Zeile bis auf die Buttons) zum `Link` auf die neue Detail-Seite. „Bestätigen"/„Öffnen"-Button bleibt fürs Bearbeiten.
- Im Dashboard: Klick auf Police-Karte → Detail-Seite.

## Schritt 2 — Cron-Job für verwaiste Dateien

Server-Route `src/routes/api/public/hooks/cleanup-orphan-uploads.ts`:
- Listet alle Objekte im Bucket `policy-uploads`.
- Holt alle `file_path`-Werte aus `policies`.
- Löscht Storage-Objekte, deren Pfad in keiner `policies`-Zeile vorkommt **und** älter als 24 h sind (Schutz vor laufenden Uploads).
- Authentifizierung: `apikey`-Header mit Anon-Key (Standard für `/api/public/*`).

`pg_cron`-Job (täglich um 3 Uhr nachts):
```sql
select cron.schedule(
  'cleanup-orphan-policy-uploads',
  '0 3 * * *',
  $$ select net.http_post(
       url := 'https://project--b0a783a8-f258-4dd1-9984-1e00ee366273.lovable.app/api/public/hooks/cleanup-orphan-uploads',
       headers := '{"Content-Type":"application/json","apikey":"<ANON_KEY>"}'::jsonb,
       body := '{}'::jsonb
     ) $$
);
```

## Was wir NICHT tun

- **Keine** Auto-Löschung von Originalen, die zu einer Police gehören. Das würde Versica's Quellenangaben kaputt machen und User-Versprechen brechen.
- Kein neues Schema, keine Migration, keine Edge Function nötig.

## Files

- **Neu:** `src/routes/_authenticated.policen.$policyId.tsx`
- **Neu:** `src/routes/api/public/hooks/cleanup-orphan-uploads.ts`
- **Edit:** `src/routes/_authenticated.policen.tsx` — Zeilen verlinken auf Detail-Seite
- **Edit:** `src/routes/_authenticated.dashboard.tsx` — Police-Karten verlinken auf Detail-Seite
- **SQL (via Supabase-Tool, nicht Migration):** `pg_cron` + `pg_net` aktivieren, Job einplanen
