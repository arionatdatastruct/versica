## Bug

Die Datei `_authenticated.policen.tsx` (Listen-Seite) wird durch Flat-Naming automatisch zur Eltern-Layout-Route für `_authenticated.policen.$policyId.tsx`. Sie rendert aber kein `<Outlet />`, also kann die Detail-Seite nicht angezeigt werden — Browser hängt im Loading-Spinner.

## Fix (1 Datei umbenennen)

Detail-Route opt-out vom Parent-Layout via TanStack-Konvention `_` am Ende des Segments:

- **Umbenennen:** `src/routes/_authenticated.policen.$policyId.tsx` → `src/routes/_authenticated.policen_.$policyId.tsx`

Der trailing underscore (`policen_`) sagt TanStack Router: „matche `/policen/...`, aber **nicht** unter dem `policen.tsx`-Layout". Damit:
- `/policen` → Listen-Seite (unverändert)
- `/policen/$policyId` → Detail-Seite (rendert eigenständig)
- Kein Outlet nötig in `policen.tsx`
- `DeleteButton`-Import aus `_authenticated.policen.tsx` bleibt funktionsfähig (relative Pfade ändern sich nicht in TanStack)

Inhalt der Datei bleibt 1:1 gleich. Auch der `createFileRoute("/_authenticated/policen/$policyId")`-String darin bleibt gleich (das URL-Pattern ändert sich nicht).

## Verifikation

Nach dem Rename:
1. Browser auf `/policen/<id>` öffnen → Split-View mit PDF links und Feldern rechts soll erscheinen.
2. Runtime-Error „Expected to find a match" verschwindet.
