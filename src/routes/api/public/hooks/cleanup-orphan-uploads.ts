import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron-Endpoint: räumt verwaiste Storage-Objekte im Bucket `policy-uploads` auf.
 *
 * Verwaist = der Storage-Pfad ist in keiner `policies.file_path`-Zeile referenziert,
 * UND die Datei ist älter als 24h (Schutz vor laufenden Uploads).
 *
 * Aufgerufen via pg_cron mit `apikey: <ANON_KEY>` Header. Pfad liegt unter
 * /api/public/* und ist daher ohne weitere Auth erreichbar.
 */
export const Route = createFileRoute("/api/public/hooks/cleanup-orphan-uploads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (!apikey) {
          return jsonResponse({ error: "Missing apikey header" }, 401);
        }

        const supabaseUrl = process.env.SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        if (!supabaseUrl || !serviceKey) {
          return jsonResponse({ error: "Server not configured" }, 500);
        }

        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // 1) Alle referenzierten file_paths sammeln
        const { data: rows, error: rowsErr } = await admin
          .from("policies")
          .select("file_path")
          .not("file_path", "is", null);
        if (rowsErr) {
          return jsonResponse({ error: rowsErr.message }, 500);
        }
        const referenced = new Set(
          (rows ?? []).map((r: any) => r.file_path).filter(Boolean) as string[],
        );

        // 2) Bucket rekursiv listen — Struktur: <userId>/<policyId>/<filename>
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const orphans: string[] = [];
        let scanned = 0;

        const { data: userDirs, error: udErr } = await admin.storage
          .from("policy-uploads")
          .list("", { limit: 1000 });
        if (udErr) {
          return jsonResponse({ error: udErr.message }, 500);
        }

        for (const userDir of userDirs ?? []) {
          if (!userDir.name) continue;
          const { data: policyDirs } = await admin.storage
            .from("policy-uploads")
            .list(userDir.name, { limit: 1000 });
          for (const policyDir of policyDirs ?? []) {
            if (!policyDir.name) continue;
            const prefix = `${userDir.name}/${policyDir.name}`;
            const { data: files } = await admin.storage
              .from("policy-uploads")
              .list(prefix, { limit: 1000 });
            for (const f of files ?? []) {
              if (!f.name) continue;
              scanned++;
              const fullPath = `${prefix}/${f.name}`;
              const createdAt = f.created_at
                ? new Date(f.created_at).getTime()
                : Date.now();
              if (!referenced.has(fullPath) && createdAt < cutoff) {
                orphans.push(fullPath);
              }
            }
          }
        }

        // 3) Verwaiste Dateien in Batches löschen
        let removed = 0;
        const BATCH = 100;
        for (let i = 0; i < orphans.length; i += BATCH) {
          const slice = orphans.slice(i, i + BATCH);
          const { error: rmErr } = await admin.storage
            .from("policy-uploads")
            .remove(slice);
          if (!rmErr) removed += slice.length;
        }

        return jsonResponse({
          ok: true,
          scanned,
          orphans: orphans.length,
          removed,
        });
      },
    },
  },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
