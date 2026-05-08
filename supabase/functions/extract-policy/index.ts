// Extract Swiss health insurance policy data from a PDF/image using Lovable AI Gateway (Gemini Flash, vision)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Du bist ein präziser Extraktor für Schweizer Krankenkassen-Policen.
Extrahiere die folgenden Felder als striktes JSON. Wenn ein Feld unsicher ist, gib null zurück.
Keine Erklärungen, nur das JSON-Objekt.`;

const SCHEMA_HINT = `{
  "insurer": "string|null",          // CSS, Helsana, Sanitas, SWICA, Concordia, Visana, Groupe Mutuel, KPT, Atupri ...
  "model": "Standard|Hausarzt|Telmed|HMO|null",
  "franchise_chf": "number|null",    // jährliche Franchise in CHF
  "monthly_premium_chf": "number|null",
  "accident_coverage": "boolean|null", // mit Unfall = true, ohne Unfall = false
  "supplementary": ["string"],       // VVG-Zusatzversicherungen
  "valid_from": "YYYY-MM-DD|null"
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const policyId = body?.policy_id;
    if (!policyId || typeof policyId !== "string") return json({ error: "policy_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: policy, error: polErr } = await admin
      .from("policies")
      .select("id, owner_id, file_path, file_mime")
      .eq("id", policyId)
      .single();
    if (polErr || !policy) return json({ error: "Policy not found" }, 404);
    if (policy.owner_id !== userId) return json({ error: "Forbidden" }, 403);
    if (!policy.file_path) return json({ error: "No file uploaded" }, 400);

    await admin.from("policies").update({ ocr_status: "processing", ocr_error: null }).eq("id", policyId);

    const { data: fileData, error: dlErr } = await admin.storage.from("policy-uploads").download(policy.file_path);
    if (dlErr || !fileData) {
      await markFailed(admin, policyId, "Datei konnte nicht geladen werden.");
      return json({ error: "Download failed" }, 500);
    }

    const arr = new Uint8Array(await fileData.arrayBuffer());
    const b64 = base64Encode(arr);
    const mime = policy.file_mime || "application/pdf";
    const dataUrl = `data:${mime};base64,${b64}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\nSchema:\n${SCHEMA_HINT}` },
          {
            role: "user",
            content: [
              { type: "text", text: "Extrahiere die Police-Daten als JSON." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      const msg = aiRes.status === 429 ? "AI-Limit erreicht – bitte später erneut." :
                  aiRes.status === 402 ? "AI-Guthaben aufgebraucht." :
                  `AI-Fehler (${aiRes.status})`;
      await markFailed(admin, policyId, msg);
      return json({ error: msg, detail: txt }, 502);
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = typeof content === "string" ? JSON.parse(content) : content; } catch { parsed = {}; }

    const supp = Array.isArray(parsed.supplementary) ? parsed.supplementary : [];

    const { error: updErr } = await admin.from("policies").update({
      insurer: parsed.insurer ?? null,
      model: parsed.model ?? null,
      franchise: numeric(parsed.franchise_chf),
      monthly_premium: numeric(parsed.monthly_premium_chf),
      accident_coverage: typeof parsed.accident_coverage === "boolean" ? parsed.accident_coverage : null,
      supplementary: supp,
      valid_from: isoDate(parsed.valid_from),
      raw_extract: aiJson,
      ocr_status: "done",
      ocr_error: null,
    }).eq("id", policyId);

    if (updErr) {
      await markFailed(admin, policyId, updErr.message);
      return json({ error: updErr.message }, 500);
    }

    return json({ ok: true, policy_id: policyId });
  } catch (e) {
    console.error("extract-policy error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
async function markFailed(admin: any, policyId: string, msg: string) {
  await admin.from("policies").update({ ocr_status: "failed", ocr_error: msg }).eq("id", policyId);
}
function numeric(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/['\s]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function isoDate(v: unknown): string | null {
  if (!v) return null;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
function base64Encode(bytes: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(s);
}
