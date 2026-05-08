## Ziel

1. PDF-Vorschau auf der Bestätigungs- und Detailseite zuverlässig anzeigen.
2. Marketing-Seiten und eingeloggte Plattform sauber per URL trennen: alles unter `/app/*` ist Plattform, alles andere ist Marketing — **eine Codebase, kein zweites Lovable-Projekt nötig.**

---

## Teil 1 — PDF-Vorschau fixen

### Diagnose

Der Code zur Vorschau existiert bereits in beiden Routen (`createSignedUrl` aus Bucket `policy-uploads` → `<iframe>` für PDF, `<img>` für Bilder). Wahrscheinliche Ursachen, dass nichts erscheint:

- `policy.file_path` ist leer/null in der DB (Upload speichert ihn evtl. nicht korrekt).
- MIME-Typ wird nicht erkannt (kein `pdf`/`image` Match → Fallback "kann nicht eingebettet werden").
- Signed URL schlägt still fehl (RLS/Bucket-Policy auf `policy-uploads`).
- Bei sehr breitem Viewport (User hat 2007px) könnte das Sticky-Layout den iframe verstecken (height 0).

### Schritte

1. **Datensatz prüfen**: kurzes Diagnose-Skript via Supabase-Query — gibt es für die Police `37760614…` einen `file_path`, einen `file_mime`, und liefert `createSignedUrl` einen Link?
2. **Defensive Detection erweitern**: Wenn `file_mime` fehlt, von `file_path`-Endung auf PDF/Bild schließen (teilweise schon vorhanden, ausweiten auf jpg/png/heic).
3. **Sichtbares Debug-Feedback**: Wenn `file_path` leer → klare Meldung "Keine Datei verknüpft – bitte erneut hochladen". Wenn signed-URL-Fehler → Fehlermeldung mit Statuscode statt nur Spinner.
4. **Layout-Absicherung**: `<aside>` bekommt `min-h-[60vh]` zusätzlich zur Höhenangabe, damit der iframe garantiert eine Größe hat.
5. **Detailseite (`policen_.$policyId.tsx`)**: gleiche Logik wie auf der Bestätigungsseite verifizieren, ggf. spiegeln.
6. **Storage-Policy prüfen**: Eine SELECT-Policy auf `policy-uploads`, die `owner_id` aus `policies` joined; falls fehlend, ergänzen.

---

## Teil 2 — `/app/*`-Trennung (Plattform vs. Marketing)

### Neue URL-Struktur

```text
Marketing (öffentlich, ein Header/Footer):
  /                  Landing
  /beratung          (existiert)
  /vergleich         (existiert)
  /preise            (neu, optional)
  /kontakt           (neu, optional)
  /auth              Login/Signup

Plattform (eingeloggt, eigener App-Header):
  /app                       → Redirect auf /app/dashboard
  /app/dashboard
  /app/policen
  /app/policen/$policyId
  /app/police-upload
  /app/police-bestaetigen/$policyId
  /app/familie
  /app/familie-optimieren
  /app/check
  /app/empfehlungen
  /app/kuendigung
```

### Schritte

1. **Routen umbenennen** (TanStack-Flat-Naming):
   - `_authenticated.dashboard.tsx` → `_authenticated.app.dashboard.tsx`
   - `_authenticated.policen.tsx` → `_authenticated.app.policen.tsx`
   - `_authenticated.policen_.$policyId.tsx` → `_authenticated.app.policen_.$policyId.tsx`
   - `_authenticated.police-upload.tsx` → `_authenticated.app.police-upload.tsx`
   - `_authenticated.police-bestaetigen.$policyId.tsx` → `_authenticated.app.police-bestaetigen.$policyId.tsx`
   - `_authenticated.familie.tsx`, `familie-optimieren.tsx`, `check.tsx`, `empfehlungen.tsx`, `kuendigung.tsx` → analog mit `app.`-Präfix.
   - Neue Layout-Datei `_authenticated.app.tsx` mit `<Outlet />` als Plattform-Shell.
   - Neue Index-Datei `_authenticated.app.index.tsx` → `<Navigate to="/app/dashboard" />`.

2. **Alle internen Links anpassen**: `Link to="/dashboard"` → `Link to="/app/dashboard"` etc. Betrifft `Header.tsx`, alle Plattform-Seiten und `policy-actions`.

3. **Alte URLs sauber redirecten**: Auf den Top-Level-Marketing-Routen `/dashboard`, `/policen` etc. eine Redirect-Komponente, die auf `/app/...` umleitet (Bookmark-Schutz). Alternativ leichter: nur in Header/Auth-Flow konsequent neue URLs verwenden, alte Routen löschen → 404 (akzeptabel, da bisher nur intern genutzt).

4. **Header-Variante**: `Header.tsx` erkennt anhand von `pathname.startsWith("/app")`, ob Marketing- oder App-Header gerendert wird (Marketing: "Anmelden / Kostenlos starten", App: "Dashboard / Policen / Familie / Logout").

5. **Marketing-Footer** bleibt nur auf `/`-Bereich; auf `/app/*` Footer ausblenden.

### Warum kein zweites Projekt?

- Eine Auth-Session, ein Datenmodell, ein Deploy.
- Geteilte UI-Komponenten (Buttons, Tokens) ohne Sync-Aufwand.
- Subdomain (`app.versica.ch`) lässt sich später trotzdem nachrüsten — Cloudflare/Custom-Domain auf gleiche App, der `/app/*`-Prefix kann dann optional weggelassen werden.

---

## Reihenfolge

1. Diagnose & Fix der PDF-Vorschau (klein, ~20 Min).
2. Routen umbenennen + Links aktualisieren (~30 Min, ein Commit).
3. Header/Footer kontextabhängig rendern (~15 Min).

Marketing-Landingpage-Überarbeitung (Hero, Features, Pricing-Sektion etc.) ist bewusst **nicht** Teil dieses Plans — das machen wir als separaten Schritt, nachdem die Trennung steht.
