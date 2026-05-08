## Ausgangslage

Die neue Function nutzt Klippa **generische** API (`financial_full`) + einen handgeschriebenen Parser für CSS-Police-Layouts. Zwei Probleme:

1. **Crash beim Antwort-Parsen**: `await klippaRes.json()` wirft `Unexpected non-whitespace character at position 4`, weil Klippa bei Fehlern manchmal HTML/Plain-Text liefert statt JSON. Dadurch fliegt die ganze Function in den Catch und gibt 500 zurück, ohne `ocr_status` aufzuräumen.
2. **Parser zu brittle**: Funktioniert für die CSS-Beispiel-Police, scheitert aber bei Helsana, Sanitas, Visana etc. — andere Tabellen-Strukturen, andere Keys, andere Regex-Patterns.

## Plan

### 1. Edge Function `process-policy` härten (kein Rewrite, nur Patch)

- **Defensives Antwort-Parsing**: erst `await klippaRes.text()`, dann `JSON.parse` im try/catch. Bei Parse-Fehler → `fail(admin, policyId, "Klippa lieferte kein JSON: …")` mit den ersten 300 Zeichen der Antwort im `ocr_error`.
- **Top-Level Catch räumt auf**: Im äusseren `catch` zusätzlich `ocr_status='failed'` + `ocr_error` setzen, damit die UI nie auf `processing` hängen bleibt. Antwort-Status bleibt 200, damit die Bestätigungsseite trotzdem erreichbar ist.
- **Klippa-Timeout absichern**: `AbortController` mit z. B. 90 s, damit wir nicht in den Edge-Function-Worker-Timeout laufen.
- **`raw_text` zusätzlich speichern**: für den Fall, dass der Parser nichts findet — User sieht in der UI dann wenigstens den OCR-Text.

### 2. Parser robuster machen + LLM-Fallback

- **Bestehender Regex-Parser bleibt** (schnell, gratis, funktioniert für CSS).
- **LLM-Fallback nur wenn Pflichtfelder fehlen**: Wenn nach dem Regex-Parser `insurer`, `kvg_monthly_premium` oder `total_monthly_premium` `null` sind → einmal Lovable AI Gateway (`google/gemini-2.5-flash`) mit dem Klippa-Rohtext aufrufen und die fehlenden Felder ergänzen lassen. Strikter JSON-Output via `response_format: { type: "json_object" }`.
- Damit funktioniert es out-of-the-box für CSS schnell, und für andere Versicherer als Fallback ohne dass wir pro Versicherer Code schreiben.
- `LOVABLE_API_KEY` ist bereits gesetzt ✅.

### 3. Frontend (kleine UX-Anpassungen)

- **`police-upload.tsx`**: Statusmeldung weicher → "Versica liest deine Police … das kann bis zu einer Minute dauern". Sicherheits-Timeout: nach 90 s trotzdem zur Bestätigungsseite navigieren.
- **`police-bestaetigen.$policyId.tsx`**: Wenn `ocr_status` `pending` oder `processing` ist beim Laden → kurz pollen (alle 2 s, max 60 s) und Form danach mit Werten füllen. Bei `failed` → Banner "Auslesen war ungenau, bitte Felder kontrollieren/ergänzen", Form bleibt bedienbar mit dem `raw_text` als Hilfe.

### 4. Aufräumen

- `KLIPPA_CONFIG_ID`-Secret kann gelöscht werden (wird von der neuen Function nicht mehr genutzt).
- `supabase/config.toml` bleibt unverändert (`verify_jwt = true`).
- Edge Function `extract-policy` ist bereits gelöscht — ✅.

## Was am Ende anders ist

- **Keine 500er mehr**, wenn Klippa mal HTML zurückgibt — sauberer `failed`-Status + Fehlertext in der UI.
- **`processing`-Hänger** sind ausgeschlossen, weil der äussere Catch immer aufräumt.
- **Andere Versicherer** funktionieren auch (LLM-Fallback), ohne den CSS-Parser zu brechen.
- **UX bleibt synchron**: Upload → Lade-Screen → Bestätigungsseite mit ausgefüllten Feldern.

Wenn das so passt, setze ich die Function-Härtung + LLM-Fallback + Polling-Bestätigungsseite um.