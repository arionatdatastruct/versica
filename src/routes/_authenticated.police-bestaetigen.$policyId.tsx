import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VersicaIcon } from "@/components/VersicaIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, CheckCircle2, Plus, Trash2, Copy as CopyIcon, ExternalLink, FileWarning } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { deletePolicy } from "@/lib/policy-actions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/police-bestaetigen/$policyId")({
  component: PoliceBestaetigen,
});

const POLICY_TYPES = [
  { value: "grundversicherung", label: "Grundversicherung (KVG)" },
  { value: "zusatzversicherung", label: "Zusatzversicherung (VVG)" },
  { value: "kombiniert", label: "Grund + Zusatz kombiniert" },
];
const KVG_MODELS = ["Standard", "Hausarzt", "Telmed", "HMO"];
const FRANCHISES = [300, 500, 1000, 1500, 2000, 2500];
const CONFIDENCE_THRESHOLD = 0.7;

type Member = { id: string; first_name: string; last_name: string | null; is_self: boolean };
type VVGProduct = { name: string; monthly_premium: number | null };

function PoliceBestaetigen() {
  const { policyId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [duplicates, setDuplicates] = useState<Array<{ id: string; insurer: string | null; policy_number: string | null; valid_from: string | null; confirmed_at: string | null }>>([]);
  const [discarding, setDiscarding] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Police-Info
  const [policyType, setPolicyType] = useState<string>("");
  const [insurer, setInsurer] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [memberId, setMemberId] = useState<string>("");

  // KVG
  const [kvgModel, setKvgModel] = useState("");
  const [kvgFranchise, setKvgFranchise] = useState("");
  const [kvgAccident, setKvgAccident] = useState(false);
  const [kvgPremium, setKvgPremium] = useState("");

  // VVG
  const [vvgProducts, setVvgProducts] = useState<VVGProduct[]>([]);

  useEffect(() => {
    if (!policyId || !user) return;
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 30; // 30 * 2s = 60s

    const load = async (): Promise<void> => {
      const [{ data: pRaw }, { data: ms }] = await Promise.all([
        supabase.from("policies").select("*").eq("id", policyId).eq("owner_id", user.id).maybeSingle(),
        supabase.from("household_members")
          .select("id, first_name, last_name, is_self, household_id, households!inner(owner_id)")
          .eq("households.owner_id", user.id),
      ]);
      if (cancelled) return;
      const p: any = pRaw;

      // Wenn OCR noch läuft, kurz pollen statt direkt anzuzeigen
      if (p && (p.ocr_status === "pending" || p.ocr_status === "processing") && attempts < MAX_ATTEMPTS) {
        attempts++;
        setTimeout(load, 2000);
        return;
      }

      if (p) {
        setPolicy(p);
        setSignedUrl(null);
        setPreviewError(null);
        setPolicyType(p.policy_type ?? "");
        setInsurer(p.insurer ?? "");
        setPolicyNumber(p.policy_number ?? "");
        setValidFrom(p.valid_from ?? "");
        setValidTo(p.valid_to ?? "");
        setKvgModel(p.kvg_model ?? p.model ?? "");
        setKvgFranchise(p.kvg_franchise != null ? String(p.kvg_franchise) : (p.franchise != null ? String(p.franchise) : ""));
        setKvgAccident(!!(p.kvg_accident_coverage ?? p.accident_coverage));
        setKvgPremium(p.kvg_monthly_premium != null ? String(p.kvg_monthly_premium) : (p.monthly_premium != null ? String(p.monthly_premium) : ""));
        setVvgProducts(Array.isArray(p.vvg_products) ? (p.vvg_products as VVGProduct[]) : []);
        if (p.member_id) setMemberId(p.member_id);
        if (p.file_path) {
          const { data: urlData, error: urlErr } = await supabase.storage
            .from("policy-uploads")
            .createSignedUrl(p.file_path, 3600);
          if (cancelled) return;
          if (urlErr) {
            console.error("[Preview] signed URL error", urlErr, "path:", p.file_path);
            setPreviewError(`Vorschau konnte nicht geladen werden: ${urlErr.message}`);
          } else {
            console.log("[Preview] signed URL ok for", p.file_path, "mime:", p.file_mime);
            setSignedUrl(urlData?.signedUrl ?? null);
          }
        } else {
          console.warn("[Preview] policy has no file_path", p.id);
          setPreviewError("Keine Originaldatei verknüpft – bitte erneut hochladen.");
        }
      }
      if (ms) {
        const mapped: Member[] = ms.map((m: any) => ({
          id: m.id, first_name: m.first_name, last_name: m.last_name, is_self: m.is_self,
        }));
        setMembers(mapped);
        let autoMatch: string | undefined;
        if (p?.insured_first_name || p?.insured_last_name) {
          const fn = (p.insured_first_name ?? "").toLowerCase().trim();
          const ln = (p.insured_last_name ?? "").toLowerCase().trim();
          autoMatch = mapped.find((m) =>
            m.first_name.toLowerCase().trim() === fn &&
            (m.last_name ?? "").toLowerCase().trim() === ln
          )?.id;
        }
        setMemberId((cur) => cur || autoMatch || mapped.find((m) => m.is_self)?.id || mapped[0]?.id || "");
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [policyId, user]);

  // Duplikat-Erkennung: andere Policen desselben Owners mit gleichem Versicherer + Person + Gültigkeit
  // ODER identischer Policennummer.
  useEffect(() => {
    if (!user || !policy) return;
    let cancelled = false;
    const run = async () => {
      const orParts: string[] = [];
      if (policy.policy_number) {
        orParts.push(`policy_number.eq.${policy.policy_number}`);
      }
      const insurer = (policy.insurer ?? "").trim();
      const fn = (policy.insured_first_name ?? "").trim();
      const ln = (policy.insured_last_name ?? "").trim();
      const vf = policy.valid_from;
      // Wir filtern Versicherer/Person/Datum clientseitig — Supabase OR mit AND-Gruppen ist unhandlich.
      const { data } = await supabase
        .from("policies")
        .select("id, insurer, policy_number, insured_first_name, insured_last_name, valid_from, confirmed_at")
        .eq("owner_id", user.id)
        .neq("id", policy.id)
        .limit(50);
      if (cancelled || !data) return;
      const matches = data.filter((d: any) => {
        if (policy.policy_number && d.policy_number === policy.policy_number) return true;
        if (!insurer || !vf) return false;
        const sameInsurer = (d.insurer ?? "").trim().toLowerCase() === insurer.toLowerCase();
        const sameFn = (d.insured_first_name ?? "").trim().toLowerCase() === fn.toLowerCase();
        const sameLn = (d.insured_last_name ?? "").trim().toLowerCase() === ln.toLowerCase();
        const sameDate = d.valid_from === vf;
        return sameInsurer && sameDate && (sameFn || sameLn);
      });
      setDuplicates(matches);
    };
    void run();
    return () => { cancelled = true; };
  }, [user, policy]);

  const discardCurrent = async () => {
    if (!policy) return;
    setDiscarding(true);
    try {
      await deletePolicy(policy.id, policy.file_path);
      toast.success("Police verworfen");
      navigate({ to: "/policen" });
    } catch (e: any) {
      toast.error("Löschen fehlgeschlagen: " + (e?.message ?? e));
      setDiscarding(false);
    }
  };

  const conf = (key: string): number | null => {
    const c = policy?.ocr_confidence?.[key];
    return typeof c === "number" ? c : null;
  };
  const isLow = (key: string) => { const c = conf(key); return c != null && c < CONFIDENCE_THRESHOLD; };

  const showKvg = !policyType || policyType === "grundversicherung" || policyType === "kombiniert";
  const showVvg = !policyType || policyType === "zusatzversicherung" || policyType === "kombiniert";

  const totalPremium =
    (parseFloat(kvgPremium) || 0) +
    vvgProducts.reduce((s, p) => s + (Number(p.monthly_premium) || 0), 0);

  const addVvg = () => setVvgProducts([...vvgProducts, { name: "", monthly_premium: null }]);
  const updateVvg = (i: number, patch: Partial<VVGProduct>) =>
    setVvgProducts(vvgProducts.map((p, idx) => idx === i ? { ...p, ...patch } : p));
  const removeVvg = (i: number) => setVvgProducts(vvgProducts.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!memberId) return toast.error("Bitte wähle eine Person aus.");
    if (!policyType) return toast.error("Bitte wähle den Police-Typ.");
    setSaving(true);
    const { error } = await supabase.from("policies").update({
      member_id: memberId,
      policy_type: policyType,
      insurer: insurer || null,
      policy_number: policyNumber || null,
      valid_from: validFrom || null,
      valid_to: validTo || null,
      kvg_model: showKvg ? (kvgModel || null) : null,
      kvg_franchise: showKvg && kvgFranchise ? parseFloat(kvgFranchise) : null,
      kvg_accident_coverage: showKvg ? kvgAccident : null,
      kvg_monthly_premium: showKvg && kvgPremium ? parseFloat(kvgPremium) : null,
      vvg_products: showVvg ? vvgProducts.filter(p => p.name) : [],
      vvg_total_monthly_premium: showVvg
        ? vvgProducts.reduce((s, p) => s + (Number(p.monthly_premium) || 0), 0)
        : null,
      total_monthly_premium: totalPremium || null,
      // Legacy-Felder gespiegelt für Rückwärtskompatibilität
      model: showKvg ? (kvgModel || null) : null,
      franchise: showKvg && kvgFranchise ? parseFloat(kvgFranchise) : null,
      accident_coverage: showKvg ? kvgAccident : null,
      monthly_premium: showKvg && kvgPremium ? parseFloat(kvgPremium) : null,
      supplementary: showVvg ? vvgProducts.filter(p => p.name).map(p => p.name) : [],
      confirmed_at: new Date().toISOString(),
    }).eq("id", policyId).eq("owner_id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Police gespeichert.");
    navigate({ to: "/dashboard" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!policy) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-2xl py-16 text-center">Police nicht gefunden.</main>
        <Footer />
      </div>
    );
  }

  const failed = policy.ocr_status === "failed";
  const completed = policy.ocr_status === "completed";
  const isPdf =
    (policy.file_mime ?? "").includes("pdf") ||
    (policy.file_path ?? "").toLowerCase().endsWith(".pdf");
  const isImage = (policy.file_mime ?? "").startsWith("image/");
  const isHeic =
    (policy.file_mime ?? "").includes("heic") ||
    (policy.file_mime ?? "").includes("heif");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 lg:py-10 px-4">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] gap-6 items-start">
          <aside className="card-soft overflow-hidden lg:sticky lg:top-6 h-[58vh] lg:h-[calc(100vh-7rem)]">
            <div className="h-14 px-4 border-b border-border flex items-center justify-between gap-3">
              <p className="text-sm font-semibold truncate">Dokument-Vorschau</p>
              {signedUrl && (
                <Button asChild variant="outline" size="sm" className="rounded-full shrink-0">
                  <a href={signedUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> PDF öffnen
                  </a>
                </Button>
              )}
            </div>
            <div className="h-[calc(100%-3.5rem)]">
              {!policy.file_path ? (
                <EmptyPreview text="Keine Originaldatei hinterlegt." />
              ) : previewError ? (
                <EmptyPreview text={previewError} />
              ) : !signedUrl ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : isHeic ? (
                <EmptyPreview text={'HEIC-Vorschau wird vom Browser nicht unterstützt — über „PDF öffnen" herunterladen.'} />
              ) : isPdf ? (
                <iframe src={signedUrl} title="Police-Vorschau" className="w-full h-full border-0" />
              ) : isImage ? (
                <div className="h-full overflow-auto bg-muted/40 flex items-center justify-center p-2">
                  <img src={signedUrl} alt="Police-Vorschau" className="max-w-full h-auto rounded-md shadow-sm" />
                </div>
              ) : (
                <EmptyPreview text="Dateiformat kann nicht eingebettet werden." />
              )}
            </div>
          </aside>
          <section className="min-w-0">
        <div className="flex items-start gap-4 mb-8">
          <VersicaIcon size="lg" />
          <div className="bg-primary-light rounded-3xl rounded-tl-md px-5 py-4 shadow-sm flex-1">
            <p className="leading-relaxed">
              {failed
                ? "Hmm, das Auslesen hat nicht ganz geklappt. Magst du die Felder kurz manuell ausfüllen? Dauert keine 2 Minuten."
                : completed
                ? "Hier ist, was ich aus deiner Police gelesen habe – stimmt das so? Felder mit orangem Hinweis bitte besonders prüfen."
                : "Bitte fülle die Felder aus, die du aus deiner Police kennst."}
            </p>
          </div>
        </div>

        {failed && policy.ocr_error && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <strong>Auslesen fehlgeschlagen:</strong> {policy.ocr_error}
          </div>
        )}

        {duplicates.length > 0 && !policy.confirmed_at && (
          <div className="mb-6 rounded-2xl bg-warning/10 border border-warning/40 p-5">
            <div className="flex items-start gap-3">
              <CopyIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1">Mögliches Duplikat erkannt</p>
                <p className="text-sm text-foreground-secondary mb-3">
                  Du hast bereits {duplicates.length === 1 ? "eine ähnliche Police" : `${duplicates.length} ähnliche Policen`} gespeichert
                  {duplicates[0].insurer ? ` (${duplicates[0].insurer}` : ""}
                  {duplicates[0].policy_number ? `, Nr. ${duplicates[0].policy_number}` : ""}
                  {duplicates[0].insurer ? ")" : ""}.
                  Möchtest du diesen Upload trotzdem behalten?
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link to="/police-bestaetigen/$policyId" params={{ policyId: duplicates[0].id }}>
                      Bestehende öffnen
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={discardCurrent}
                    disabled={discarding}
                  >
                    {discarding ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                    Diesen Upload verwerfen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm font-medium text-primary mb-3">Schritt 2 von 3 · Bestätigen</p>
        <h1 className="text-3xl lg:text-4xl font-semibold mb-8">Stimmen die Angaben?</h1>

        {/* Versicherte Person */}
        <Section title="Versicherte Person">
          <Field label="Für welche Person ist diese Police?">
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger><SelectValue placeholder="Person wählen" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.first_name}{m.last_name ? ` ${m.last_name}` : ""}{m.is_self ? " (Du)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        {/* Police-Info */}
        <Section title="Police-Info">
          <Field label="Art der Police">
            <Select value={policyType} onValueChange={setPolicyType}>
              <SelectTrigger><SelectValue placeholder="Typ wählen" /></SelectTrigger>
              <SelectContent>
                {POLICY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Versicherer" lowConf={isLow("insurer")}>
            <Input value={insurer} onChange={(e) => setInsurer(e.target.value)} placeholder="z. B. CSS, Helsana, Sanitas" />
          </Field>
          <Field label="Policennummer" lowConf={isLow("policy_number")}>
            <Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="optional" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Gültig ab" lowConf={isLow("valid_from")}>
              <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </Field>
            <Field label="Gültig bis" lowConf={isLow("valid_to")}>
              <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* KVG / Grundversicherung */}
        {showKvg && (
          <Section title="Grundversicherung (KVG)">
            <Field label="Modell" lowConf={isLow("kvg_model")}>
              <Select value={kvgModel} onValueChange={setKvgModel}>
                <SelectTrigger><SelectValue placeholder="Modell wählen" /></SelectTrigger>
                <SelectContent>{KVG_MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Franchise (CHF)" lowConf={isLow("kvg_franchise")}>
                <Select value={kvgFranchise} onValueChange={setKvgFranchise}>
                  <SelectTrigger><SelectValue placeholder="z. B. 2500" /></SelectTrigger>
                  <SelectContent>{FRANCHISES.map((f) => <SelectItem key={f} value={String(f)}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Monatsprämie KVG (CHF)" lowConf={isLow("kvg_monthly_premium")}>
                <Input type="number" step="0.05" value={kvgPremium} onChange={(e) => setKvgPremium(e.target.value)} placeholder="412.50" />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div>
                <Label className="text-base">Unfalldeckung eingeschlossen</Label>
                {isLow("kvg_accident_coverage") && <p className="text-xs text-amber-600 mt-1">Bitte prüfen</p>}
              </div>
              <Switch checked={kvgAccident} onCheckedChange={setKvgAccident} />
            </div>
          </Section>
        )}

        {/* VVG / Zusatzversicherungen */}
        {showVvg && (
          <Section title="Zusatzversicherungen (VVG)">
            {vvgProducts.length === 0 && (
              <p className="text-sm text-foreground-secondary">Keine Zusatzversicherungen erkannt. Über „Hinzufügen" eintragen.</p>
            )}
            {vvgProducts.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-3 items-end">
                <Field label={`Zusatz ${i + 1}`}>
                  <Input value={p.name} onChange={(e) => updateVvg(i, { name: e.target.value })}
                    placeholder="z. B. Spital halbprivat" />
                </Field>
                <Field label="Prämie/Mt.">
                  <Input type="number" step="0.05" value={p.monthly_premium ?? ""}
                    onChange={(e) => updateVvg(i, { monthly_premium: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="0.00" />
                </Field>
                <Button variant="ghost" size="icon" onClick={() => removeVvg(i)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addVvg}>
              <Plus className="w-4 h-4 mr-1" /> Zusatz hinzufügen
            </Button>
          </Section>
        )}

        {/* Total */}
        <div className="card-soft p-6 mt-6 bg-primary-light/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-secondary">Gesamtprämie pro Monat</p>
              <p className="text-3xl font-semibold text-primary-dark">CHF {totalPremium.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 gap-3">
          <Button variant="outline" onClick={() => navigate({ to: "/police-upload" })}>Erneut hochladen</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Speichern & weiter
          </Button>
        </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card-soft p-6 space-y-5 mb-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function EmptyPreview({ text }: { text: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-foreground-secondary">
      <FileWarning className="w-10 h-10 mb-3 opacity-50" />
      <p className="text-sm max-w-xs">{text}</p>
    </div>
  );
}

function Field({ label, lowConf, children }: { label: string; lowConf?: boolean; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-sm">{label}</Label>
        {lowConf && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" /> Bitte prüfen
          </span>
        )}
      </div>
      <div className={lowConf ? "ring-2 ring-amber-400 rounded-md" : ""}>{children}</div>
    </div>
  );
}
