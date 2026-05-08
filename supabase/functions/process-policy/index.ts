// Edge Function: process-policy
// Klippa generic OCR (financial_full) + Regex-Parser für CH-Krankenkassen
// + LLM-Fallback (Lovable AI Gateway) wenn Pflichtfelder fehlen.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KLIPPA_GENERIC_URL =
  "https://dochorizon.klippa.com/api/services/document_capturing/v1/generic";
const KLIPPA_TIMEOUT_MS = 90_000;
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LLM_MODEL = "google/gemini-2.5-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let admin: any = null;
  let policyId: string | null = null;

  try {
    const KLIPPA_API_KEY = Deno.env.get("KLIPPA_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!KLIPPA_API_KEY) return json({ error: "KLIPPA_API_KEY Secret fehlt" }, 500);
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE) {
      return json({ error: "Supabase Secrets fehlen" }, 500);
    }

    console.log("[process-policy] Start");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Nicht authentifiziert" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Ungültiger Token" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    policyId = body?.policyId ?? null;
    if (!policyId) return json({ error: "policyId fehlt" }, 400);

    console.log(`[process-policy] User: ${userId}, Policy: ${policyId}`);

    admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: policy, error: pErr } = await admin
      .from("policies")
      .select("id, owner_id, file_path, file_mime")
      .eq("id", policyId)
      .maybeSingle();
    if (pErr || !policy) return json({ error: "Police nicht gefunden" }, 404);
    if (policy.owner_id !== userId) return json({ error: "Kein Zugriff" }, 403);
    if (!policy.file_path) return json({ error: "Keine Datei" }, 400);

    await admin
      .from("policies")
      .update({ ocr_status: "processing", ocr_error: null })
      .eq("id", policyId);

    const { data: fileData, error: fErr } = await admin.storage
      .from("policy-uploads")
      .download(policy.file_path);
    if (fErr || !fileData) {
      return await fail(admin, policyId, "Datei konnte nicht geladen werden");
    }
    console.log(`[process-policy] Datei geladen: ${fileData.size} bytes`);

    const buf = new Uint8Array(await fileData.arrayBuffer());
    const base64 = encodeBase64(buf);

    // Klippa mit Timeout aufrufen
    console.log("[process-policy] Rufe Klippa generische API auf");
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), KLIPPA_TIMEOUT_MS);
    let klippaRes: Response;
    try {
      const filename = (policy.file_path as string).split("/").pop() || "document.pdf";
      const contentType = policy.file_mime || "application/pdf";
      klippaRes = await fetch(KLIPPA_GENERIC_URL, {
        method: "POST",
        headers: { "x-api-key": KLIPPA_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          documents: [{ content_type: contentType, data: base64, filename }],
        }),
        signal: ctrl.signal,
      });
    } catch (e: any) {
      clearTimeout(timeoutId);
      const msg =
        e?.name === "AbortError"
          ? `Klippa Timeout nach ${KLIPPA_TIMEOUT_MS / 1000}s`
          : `Klippa Netzwerkfehler: ${e?.message ?? e}`;
      return await fail(admin, policyId, msg);
    }
    clearTimeout(timeoutId);

    // Defensives JSON-Parsing — Klippa schickt bei Fehlern manchmal HTML/Text
    const klippaText = await klippaRes.text();
    let klippaJson: any;
    try {
      klippaJson = JSON.parse(klippaText);
    } catch {
      const snippet = klippaText.slice(0, 300).replace(/\s+/g, " ");
      return await fail(
        admin,
        policyId,
        `Klippa lieferte kein JSON (HTTP ${klippaRes.status}): ${snippet}`,
      );
    }

    if (!klippaRes.ok) {
      console.error("[process-policy] Klippa Fehler:", klippaRes.status, klippaJson);
      const errMsg = `Klippa: ${klippaRes.status} ${klippaJson?.message ?? ""}`.trim();
      return await fail(admin, policyId, errMsg);
    }
    console.log("[process-policy] Klippa OK");

    // Regex-Parser
    const extracted = parseSwissInsurancePolicy(klippaJson);
    const rawText = extractRawText(klippaJson);
    console.log("[process-policy] Regex-Extract:", JSON.stringify(extracted).slice(0, 300));

    // LLM-Fallback wenn Pflichtfelder fehlen
    const needsLLM =
      !extracted.insurer ||
      (extracted.kvg_monthly_premium == null && extracted.total_monthly_premium == null);

    if (needsLLM && LOVABLE_API_KEY && rawText) {
      console.log("[process-policy] Starte LLM-Fallback");
      try {
        const llm = await llmExtract(LOVABLE_API_KEY, rawText);
        if (llm) {
          for (const k of Object.keys(llm) as (keyof typeof extracted)[]) {
            if ((extracted as any)[k] == null && (llm as any)[k] != null) {
              (extracted as any)[k] = (llm as any)[k];
            }
          }
          // VVG-Produkte nur ergänzen, wenn Regex nichts gefunden hat
          if (
            (!extracted.vvg_products || extracted.vvg_products.length === 0) &&
            Array.isArray(llm.vvg_products)
          ) {
            extracted.vvg_products = llm.vvg_products;
          }
          console.log("[process-policy] LLM-Fallback OK");
        }
      } catch (e: any) {
        console.error("[process-policy] LLM-Fallback Fehler:", e?.message ?? e);
        // kein fail — Regex-Werte reichen oder User füllt manuell aus
      }
    }

    const updateData = {
      ocr_status: "completed",
      ocr_error: null,
      raw_data: klippaJson,
      raw_text: rawText,
      ...extracted,
    };

    const { error: updErr } = await admin
      .from("policies")
      .update(updateData)
      .eq("id", policyId);
    if (updErr) {
      console.error("[process-policy] DB Fehler:", updErr);
      return await fail(admin, policyId, "DB: " + updErr.message);
    }

    console.log("[process-policy] FERTIG");
    return json({ ok: true, policyId, extracted }, 200);
  } catch (e: any) {
    console.error("[process-policy] Top-Level Fehler:", e);
    const msg = String(e?.message ?? e);
    if (admin && policyId) {
      try {
        await admin
          .from("policies")
          .update({ ocr_status: "failed", ocr_error: msg })
          .eq("id", policyId);
      } catch {}
    }
    return json({ ok: false, error: msg }, 200);
  }
});

// =============== LLM-Fallback ===============
async function llmExtract(apiKey: string, rawText: string) {
  const text = rawText.slice(0, 12_000); // genug Kontext, schont Tokens
  const sys =
    "Du extrahierst Daten aus dem OCR-Text einer Schweizer Krankenversicherungs-Police. " +
    "Antworte ausschliesslich mit gültigem JSON nach dem vorgegebenen Schema. " +
    "Felder die du nicht findest setzt du auf null. " +
    "Daten als YYYY-MM-DD. Beträge als Zahl in CHF (kein Tausendertrennzeichen). " +
    "policy_type ist 'grundversicherung' wenn nur KVG, 'zusatzversicherung' wenn nur VVG, sonst 'kombiniert'.";

  const schema = {
    type: "object",
    properties: {
      insurer: { type: ["string", "null"] },
      policy_number: { type: ["string", "null"] },
      policy_type: { type: ["string", "null"], enum: ["grundversicherung", "zusatzversicherung", "kombiniert", null] },
      insured_first_name: { type: ["string", "null"] },
      insured_last_name: { type: ["string", "null"] },
      insured_birth_date: { type: ["string", "null"] },
      valid_from: { type: ["string", "null"] },
      valid_to: { type: ["string", "null"] },
      kvg_model: { type: ["string", "null"], enum: ["Standard", "Hausarzt", "Telmed", "HMO", null] },
      kvg_franchise: { type: ["number", "null"] },
      kvg_monthly_premium: { type: ["number", "null"] },
      kvg_accident_coverage: { type: ["boolean", "null"] },
      vvg_products: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            monthly_premium: { type: ["number", "null"] },
          },
          required: ["name"],
        },
      },
      vvg_total_monthly_premium: { type: ["number", "null"] },
      total_monthly_premium: { type: ["number", "null"] },
    },
  };

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Schema:\n${JSON.stringify(schema)}\n\nOCR-Text:\n${text}` },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// =============== Klippa Helpers ===============
function extractRawText(klippaResponse: any): string {
  const data = klippaResponse?.data || {};
  const components = data.components || {};
  // Versuche unterschiedliche Pfade
  if (typeof data.raw_text === "string") return data.raw_text;
  if (typeof components.raw_text === "string") return components.raw_text;
  // Fallback: alle Cell-Inhalte aus Tabellen + KV-Pairs konkatenieren
  const parts: string[] = [];
  const tables = components?.tables?.tables || [];
  for (const t of tables) {
    for (const c of t.cells || []) {
      if (c?.content) parts.push(c.content);
    }
  }
  const kvs = components?.key_value_pairs?.key_value_pairs || [];
  for (const kv of kvs) {
    const k = kv?.key?.content;
    const v = kv?.value?.content;
    if (k || v) parts.push(`${k ?? ""}: ${v ?? ""}`);
  }
  return parts.join("\n");
}

// =============== Regex-Parser (CSS-fokussiert) ===============
function parseSwissInsurancePolicy(klippaResponse: any) {
  const data = klippaResponse?.data || {};
  const components = data.components || {};
  const kvPairs = components.key_value_pairs?.key_value_pairs || [];
  const tables = components.tables?.tables || [];
  console.log(`[parser] ${kvPairs.length} KV-Pairs, ${tables.length} Tabellen`);

  function findKV(searchKey: string) {
    const found = kvPairs.find((kv: any) => {
      const key = kv?.key?.content || "";
      return key.toLowerCase().includes(searchKey.toLowerCase());
    });
    return found?.value?.content?.trim() || null;
  }
  function detectInsurer(text: string) {
    const insurers = ["CSS", "Helsana", "Sanitas", "SWICA", "Concordia", "Visana",
      "Groupe Mutuel", "KPT", "Atupri", "Sympany", "ÖKK", "EGK", "Sana24", "Aquilana", "Agrisano"];
    const upper = text.toUpperCase();
    for (const ins of insurers) if (upper.includes(ins.toUpperCase())) return ins;
    return null;
  }
  function detectKvgModel(text: string) {
    if (!text) return null;
    const lower = text.toLowerCase();
    if (lower.includes("hausarzt")) return "Hausarzt";
    if (lower.includes("hmo")) return "HMO";
    if (lower.includes("telmed")) return "Telmed";
    if (lower.includes("standard")) return "Standard";
    return null;
  }
  function parseNumber(value: any) {
    if (value == null) return null;
    const cleaned = String(value).replace(/['\sCHF]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  function parseDate(value: any) {
    if (!value) return null;
    const m = String(value).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (!m) return null;
    return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  function findTableContaining(searchText: string) {
    return tables.find((t: any) =>
      t.cells && t.cells.some((c: any) => c.content && c.content.includes(searchText)),
    );
  }

  const kvgTable = findTableContaining("Bundesgesetz über die Krankenversicherung");
  const vvgTable = findTableContaining("Versicherungsvertragsgesetz");
  const overviewTable = findTableContaining("Übersicht Total Nettoprämien");

  let kvgPremium: number | null = null;
  let kvgModel: string | null = null;
  let kvgFranchise: number | null = null;

  if (kvgTable?.cells) {
    for (const cell of kvgTable.cells) {
      const content = cell.content || "";
      if (content.includes("KVG") && content.toLowerCase().includes("versicherung")) {
        const m = detectKvgModel(content);
        if (m) kvgModel = m;
      }
      const fr = content.match(/Jahresfranchise CHF (\d+)/);
      if (fr) kvgFranchise = parseInt(fr[1]);
      if (content.includes("Total Nettoprämie KVG")) {
        for (const c of kvgTable.cells) {
          if (c.row_index === cell.row_index && c.column_index > cell.column_index && c.content) {
            const num = parseNumber(c.content);
            if (num !== null) { kvgPremium = num; break; }
          }
        }
      }
    }
  }

  if (kvgPremium === null && overviewTable?.cells) {
    for (const cell of overviewTable.cells) {
      const content = cell.content || "";
      if (content.includes("KVG") && content.toLowerCase().includes("versicherung")) {
        for (const c of overviewTable.cells) {
          if (c.row_index === cell.row_index && c.column_index > cell.column_index && c.content) {
            const num = parseNumber(c.content);
            if (num !== null) { kvgPremium = num; if (!kvgModel) kvgModel = detectKvgModel(content); break; }
          }
        }
        if (kvgPremium !== null) break;
      }
    }
  }

  const vvgProducts: { name: string; monthly_premium: number }[] = [];
  let vvgTotalPremium = 0;
  if (vvgTable?.cells) {
    for (const cell of vvgTable.cells) {
      const content = cell.content || "";
      const isProduct =
        cell.column_index === 0 &&
        (content.toLowerCase().includes("versicherung") || content.includes("Heilungskosten")) &&
        !content.includes("CSS Versicherung AG") &&
        !content.includes("CSS Kranken-Versicherung AG") &&
        content.length < 200;
      if (isProduct) {
        let premium: number | null = null;
        for (const c of vvgTable.cells) {
          if (c.row_index === cell.row_index && c.column_index > 0 && c.content) {
            if (c.content.match(/^\d+\.\d{2}$/)) { premium = parseNumber(c.content); break; }
          }
        }
        if (premium !== null && premium > 0) {
          const name = content.replace(/\(AVB-Version[^)]+\)/g, "").replace(/\(ZB[^)]+\)/g, "").trim();
          vvgProducts.push({ name, monthly_premium: premium });
          vvgTotalPremium += premium;
        }
      }
    }
  }

  let totalPremium: number | null = null;
  if (overviewTable?.cells) {
    for (const cell of overviewTable.cells) {
      const content = cell.content || "";
      if (content.includes("Total") && content.includes("KVG") && content.includes("VVG")) {
        for (const c of overviewTable.cells) {
          if (c.row_index === cell.row_index && c.column_index > cell.column_index && c.content) {
            const num = parseNumber(c.content);
            if (num !== null && num > 100) { totalPremium = num; break; }
          }
        }
      }
    }
  }

  const allText = JSON.stringify(klippaResponse);
  const insurer = detectInsurer(allText);

  let firstName: string | null = null;
  let lastName: string | null = null;
  for (const table of tables) {
    if (!table.cells) continue;
    for (const cell of table.cells) {
      const content = cell.content || "";
      const m = content.match(/^([A-ZÄÖÜ][a-zäöüß]+)\s+([A-ZÄÖÜ][a-zäöüß]+)\s+Kundennummer/);
      if (m) { firstName = m[1]; lastName = m[2]; break; }
    }
    if (firstName) break;
  }

  let policyType: "grundversicherung" | "zusatzversicherung" | "kombiniert" = "grundversicherung";
  if (vvgProducts.length > 0 && kvgPremium) policyType = "kombiniert";
  else if (vvgProducts.length > 0 && !kvgPremium) policyType = "zusatzversicherung";

  const accidentCoverage = !allText.toLowerCase().includes("ohne unfall");

  return {
    insurer,
    policy_number: findKV("Policennummer") || findKV("Police"),
    policy_type: policyType,
    insured_first_name: firstName,
    insured_last_name: lastName,
    insured_birth_date: parseDate(findKV("Geburtsdatum")),
    valid_from: parseDate(findKV("Police gültig ab")),
    valid_to: null as string | null,
    kvg_model: kvgModel,
    kvg_franchise: kvgFranchise,
    kvg_monthly_premium: kvgPremium,
    kvg_accident_coverage: accidentCoverage,
    vvg_products: vvgProducts,
    vvg_total_monthly_premium: vvgTotalPremium > 0 ? vvgTotalPremium : null,
    total_monthly_premium: totalPremium,
  };
}

// =============== HTTP / Encoding Helpers ===============
async function fail(admin: any, policyId: string, msg: string) {
  console.error("[process-policy] FAIL:", msg);
  await admin
    .from("policies")
    .update({ ocr_status: "failed", ocr_error: msg })
    .eq("id", policyId);
  return json({ ok: false, error: msg }, 200);
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
