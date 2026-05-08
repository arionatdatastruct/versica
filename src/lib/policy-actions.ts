import { supabase } from "@/integrations/supabase/client";

/**
 * Loescht eine Police inklusive der zugehoerigen Datei aus dem Storage-Bucket.
 * RLS sorgt dafuer, dass nur der Owner loeschen kann.
 */
export async function deletePolicy(policyId: string, filePath: string | null) {
  if (filePath) {
    // Best effort — Datei darf bereits weg sein
    await supabase.storage.from("policy-uploads").remove([filePath]);
  }
  const { error } = await supabase.from("policies").delete().eq("id", policyId);
  if (error) throw error;
}
