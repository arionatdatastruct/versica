// Edge Function: process-policy
// Lädt eine hochgeladene Police aus Storage, schickt sie an Klippa DocHorizon,
// schreibt die extrahierten Felder zurück in die policies-Tabelle.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KLIPPA_URL = "https://custom-ocr.klippa.com/api/v1/parseDocument";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const KLIPPA_API_KEY = Deno.env.get("KLIPPA_API_KEY");
    const KLIPPA_CONFIG_ID = Deno.env.get("KLIPPA_CONFIG_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!KLIPPA_API_KEY || !KLIPPA_CONFIG_ID) {
      return json({ error: "Klippa secrets fehlen" }, 500);
    }

    // Auth: User aus Bearer-Token holen
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Nicht authentifiziert" }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Ungültiger Token" }, 401);
    const userId = userData.user.id;

    const { policyId } = await req.json();
    if (!policyId) return json({ error: "policyId fehlt" }, 400);

    // Admin-Client für DB + Storage (RLS-bypass, wir prüfen owner_id manuell)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: policy, error: pErr } = await admin
      .from("policies")
      .select("id, owner_id, file_path, file_mime")
      .eq("id", policyId)
      .maybeSingle();
    if (pErr || !policy) return json({ error: "Police nicht gefunden" }, 404);
    if (policy.owner_id !== userId) return json({ error: "Kein Zugriff" }, 403);
    if (!policy.file_path) return json({ error: "Keine Datei" }, 400);

    // Status auf "processing"
    await admin.from("policies").update({ ocr_status: "processing" }).eq("id", policyId);

    // Datei aus Storage laden
    const { data: fileData, error: fErr } = await admin.storage
      .from("policy-uploads")
      .download(policy.file_path);
    if (fErr || !fileData) return await fail(admin, policyId, "Datei konnte nicht geladen werden");

    // Base64 für Klippa
    const buf = new Uint8Array(await fileData.arrayBuffer());
    const base64 = encodeBase64(buf);

    // Klippa aufrufen
    const klippaRes = await fetch(KLIPPA_URL, {
      method: "POST",
      headers: {
        "X-Auth-Key": KLIPPA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document: base64,
        template: KLIPPA_CONFIG_ID,
        pdf_text_extraction: "fast",
      }),
    });

    const klippaJson = await klippaRes.json();
    if (!klippaRes.ok) {
      console.error("Klippa Fehler", klippaRes.status, klippaJson);
      return await fail(admin, policyId, `Klippa: ${klippaRes.status}`);
    }

    // Klippa-Response parsen — Struktur: { data: { parsed: {...}, raw_text: "...", confidence: {...} } }
    // Wir sind defensiv, weil das genaue Format pro Custom-Config variieren kann.
    const data = klippaJson.data ?? klippaJson;
    const parsed = data.parsed ?? data.fields ?? data;
    const confidence = data.confidence ?? data.confidences ?? null;
    const rawText = data.raw_text ?? data.text ?? null;

    const get = (k: string) => {
      const v = parsed?.[k];
      if (v === undefined || v === null || v === "") return null;
      // Klippa gibt manchmal { value, confidence } pro Feld zurück
      if (typeof v === "object" && "value" in v) return (v as any).value ?? null;
      return v;
    };
    const getNum = (k: string) => {
      const v = get(k);
      if (v == null) return null;
      const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
      return isNaN(n) ? null : n;
    };
    const getBool = (k: string) => {
      const v = get(k);
      if (v == null) return null;
      if (typeof v === "boolean") return v;
      const s = String(v).toLowerCase();
      return s === "true" || s === "ja" || s === "yes" || s === "1";
    };

    const update = {
      ocr_status: "completed",
      ocr_error: null,
      ocr_confidence: confidence,
      raw_text: rawText,
      policy_type: get("policy_type"),
      insurer: get("insurer"),
      policy_number: get("policy_number"),
      insured_first_name: get("insured_first_name"),
      insured_last_name: get("insured_last_name"),
      insured_birth_date: get("insured_birth_date"),
      valid_from: get("valid_from"),
      valid_to: get("valid_to"),
      kvg_model: get("kvg_model"),
      kvg_franchise: getNum("kvg_franchise"),
      kvg_accident_coverage: getBool("kvg_accident_coverage"),
      kvg_monthly_premium: getNum("kvg_monthly_premium"),
      vvg_products: get("vvg_products") ?? [],
      vvg_total_monthly_premium: getNum("vvg_total_monthly_premium"),
      total_monthly_premium: getNum("total_monthly_premium"),
    };

    const { error: updErr } = await admin.from("policies").update(update).eq("id", policyId);
    if (updErr) {
      console.error("DB-Update Fehler", updErr);
      return await fail(admin, policyId, `DB: ${updErr.message}`);
    }

    return json({ ok: true, policyId });
  } catch (e) {
    console.error("process-policy Fehler", e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function fail(admin: any, policyId: string, msg: string) {
  await admin.from("policies").update({ ocr_status: "failed", ocr_error: msg }).eq("id", policyId);
  return json({ ok: false, error: msg }, 200); // 200, damit Client trotzdem weiterleitet
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function encodeBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
