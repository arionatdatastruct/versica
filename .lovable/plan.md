## Versica recreation plan

The original app is a Swiss German AI insurance advisor ("Lia") with 12 pages, policy PDF uploads with AI/OCR extraction, household/member/policy management, and a warm cream + mint design system.

The new project differs in two important ways:
- **Stack**: TanStack Start (file-based routes in `src/routes/`, server functions) — not React Router DOM
- **Backend**: connected to your external Supabase project (already has `LOVABLE_API_KEY`, service role, etc. as secrets); no Lovable Cloud — but functionally equivalent

I'll port everything faithfully but adapt routing patterns to TanStack.

---

### Phase 1 — Foundations (this turn)
1. Port the **design system** to `src/styles.css` (warm cream bg, mint primary, coral accent, Lexend + Caveat fonts, soft shadows, rounded-3xl).
2. Run **database migrations** on the connected Supabase: roles, profiles, households, household_members, policies, policy_findings, RLS, signup trigger, OCR pipeline columns, `policy-uploads` storage bucket + policies.
3. Create the **auth context** + Supabase client wiring (browser client already exists at `@/integrations/supabase/client`).
4. Build the **layout primitives**: Header, Footer, Lia speech bubble, Blob, NavLink, ProtectedRoute (as TanStack `_authenticated` layout route).
5. Build the **landing page** (`/`) and **auth page** (`/auth`) with login/signup.

### Phase 2 — Core flows
6. **Police-Upload** (`/_authenticated/police-upload`): drag-drop PDF/image, upload to `policy-uploads` bucket, create policy row, invoke `extract-policy` edge function.
7. **Police-Bestätigen** (`/_authenticated/police-bestaetigen/$policyId`): show extracted fields, let user edit & confirm.
8. **Dashboard** (`/_authenticated/dashboard`): list of household members, their policies, savings findings.
9. Port **`extract-policy` edge function** verbatim (uses Lovable AI Gateway for OCR/extraction).

### Phase 3 — Advisory pages
10. **Beratung** (chat with Lia, streaming via Lovable AI), **Vergleich** (insurance comparison), **Empfehlungen** (recommendations), **Kuendigung** (cancellation letters), **FamilieOptimieren**, **Check**.

I'll do **Phase 1 in this turn** so you have a working foundation (landing, auth, design system, full schema in DB). Then I'll continue phase by phase in follow-up messages — the app is too large to do well in one shot.

---

### Technical notes (for reference)

- Routes use TanStack file-based naming: `src/routes/auth.tsx`, `src/routes/_authenticated.tsx` (guard), `src/routes/_authenticated/dashboard.tsx`, etc.
- Auth guard lives in `_authenticated.tsx` `beforeLoad` — replaces `<ProtectedRoute>`.
- Edge function `extract-policy` will be ported under `supabase/functions/extract-policy/` and auto-deployed.
- All German UI strings preserved (Schweizer Hochdeutsch).
- Lovable AI Gateway is already wired (`LOVABLE_API_KEY` exists) — used for both OCR/extraction and chat with Lia.
- Storage bucket `policy-uploads` is private with per-user folder RLS (`auth.uid()/...`).
