## Empfohlene Reihenfolge

Drei Pakete, in dieser Reihenfolge — jedes ist allein lieferbar und produktiv testbar.

---

## Phase 1 — Marketing-Auftritt (Sichtbarkeit & Vertrauen)

Ziel: `/` und Unterseiten sehen aus wie ein echtes Schweizer Insurtech-Produkt, nicht wie ein Prototyp.

### Neue/überarbeitete Routen

```text
/                Landing (Hero, How-it-works, Trust, Testimonials, CTA)
/preise          Pricing (kostenlos vs. Premium)
/ueber-uns       Über Versica (Mission, Team, FINMA-Status)
/kontakt         Kontaktformular + Adresse
/datenschutz     revDSG-konform
/impressum       Schweizer Pflichtangaben
```

Bestehend: `/beratung` und `/vergleich` werden nur leicht angepasst (konsistente Hero-Sektion, CTA "Police hochladen").

### Marketing-Header

Kontextabhängig: auf `/*` (nicht `/app/*`) zeigt der Header Marketing-Nav (Beratung, Vergleich, Preise, Über uns), auf `/app/*` die Plattform-Nav.

### Visuelles

- Hero mit echter Wertversprechen-Headline ("Verstehe deine Krankenkasse in 60 Sekunden") + Live-Demo-Mockup
- Trust-Bar (FINMA registriert, revDSG, Schweizer Hosting, SSL)
- 3-Schritt-Erklärung mit Icons (Hochladen → Versica liest aus → Empfehlung erhalten)
- Sozialer Beweis: 2-3 Mock-Testimonials oder "X Policen analysiert"
- Pricing-Tabelle: Free vs. Premium (Premium z.B. unbegrenzte Policen + Wechsel-Service)
- Footer mit allen Pflicht-Links

---

## Phase 2 — Onboarding-Flow

Ziel: Neue Nutzer landen nicht auf leerem Dashboard, sondern werden geführt.

### Flow

```text
Signup → /app/willkommen
  Schritt 1: Bestätige deinen Namen + Wohnkanton
  Schritt 2: Lade deine erste Police hoch (oder "überspringen")
  Schritt 3: Familienmitglieder hinzufügen (oder "später")
→ /app/dashboard mit Erfolgs-Banner
```

### Schritte

1. Neue Route `_authenticated.app.willkommen.tsx` mit 3-Schritt-Wizard (Stepper-UI).
2. Profilfeld `onboarded_at` in `profiles` ergänzen (Migration).
3. `_authenticated.route.tsx` redirected nach Login auf `/app/willkommen`, falls `onboarded_at` null ist.
4. Dashboard zeigt Empty-State-Variante mit Banner "Willkommen, hier ist dein Überblick" beim ersten Besuch.
5. Skip-Buttons in Schritt 2 + 3, damit Nutzer nicht blockiert werden.

---

## Phase 3 — Empfehlungs-Programm (Affiliate/Cashback)

Klärung: `/app/empfehlungen` ist heute als **Empfehlungs-/Affiliate-Seite** (Cashback für geworbene Freunde) angelegt — nicht als Versicherungs-Empfehlungen. Der Plan respektiert das.

### Schritte

1. Tabelle `referrals` (Migration):
   - `id`, `referrer_id` (uuid → profiles), `referral_code` (text unique), `created_at`, `clicks`, `signups`, `cashback_chf`
2. Beim Signup automatisch `referral_code` generieren (z.B. `versica.ch/?ref=ABC123`).
3. `/app/empfehlungen` zeigt:
   - Persönlichen Empfehlungslink mit Copy-Button
   - Statistiken (Klicks / Anmeldungen / Cashback)
   - "Wie es funktioniert" + FAQ
   - Share-Buttons (WhatsApp, E-Mail)
4. `?ref=CODE` in URL-Parameter wird beim Signup in einer Spalte `referred_by` mitgespeichert und löst Klick-/Signup-Counter aus.
5. Cashback-Logik bewusst manuell (zunächst nur Tracking — Auszahlung als nächste Iteration).

### Optional: Versicherungs-Empfehlungen separat

Wenn du **inhaltliche** Empfehlungen ("wechsle auf Telmed-Modell, sparst CHF 300/Jahr") willst, ist das ein eigenes Feature unter `/app/optimieren` — würde ich nach diesen drei Phasen angehen, weil es KI-Logik + Schweizer Krankenkassen-Daten braucht.

---

## Technische Hinweise

- **Eigener API-Key (OpenAI/Anthropic)**: Für Phase 1-3 nicht zwingend nötig. KI brauchen wir erst bei der echten Versicherungs-Optimierung (Phase 4+). Wenn du den Key trotzdem jetzt hinterlegen willst, machen wir das via Secret-Tool.
- **SEO**: Jede neue Marketing-Route bekommt eigene `head()`-Metadaten (title, description, og:image).
- **Mobile-First**: Alle neuen Sektionen werden direkt mobil-tauglich gebaut.

---

## Empfehlung: zuerst Phase 1

Sie liefert den größten sofort sichtbaren Wert (du kannst die Seite teilen / Investoren zeigen) und ist unabhängig von DB-Änderungen. Phase 2 + 3 brauchen Migrationen und werden sauberer, wenn die Marketing-Sprache (Tonalität, Versprechen) erstmal steht.
