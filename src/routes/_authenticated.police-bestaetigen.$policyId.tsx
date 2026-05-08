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
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/police-bestaetigen/$policyId")({
  component: PoliceBestaetigen,
});

const MODELS = ["Standard", "Hausarzt", "Telmed", "HMO"];
const CONFIDENCE_THRESHOLD = 0.85;
type Member = { id: string; first_name: string; last_name: string | null; is_self: boolean };

function PoliceBestaetigen() {
  const { policyId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [insurer, setInsurer] = useState("");
  const [model, setModel] = useState("");
  const [franchise, setFranchise] = useState("");
  const [premium, setPremium] = useState("");
  const [accident, setAccident] = useState(false);
  const [supplementary, setSupplementary] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [memberId, setMemberId] = useState<string>("");

  useEffect(() => {
    if (!policyId || !user) return;
    (async () => {
      const [{ data: p }, { data: ms }] = await Promise.all([
        (supabase.from("policies") as any).select("*").eq("id", policyId).single(),
        (supabase.from("household_members") as any)
          .select("id, first_name, last_name, is_self, household_id, households!inner(owner_id)")
          .eq("households.owner_id", user.id),
      ]);
      if (p) {
        setPolicy(p);
        setInsurer(p.insurer ?? "");
        setModel(p.model ?? "");
        setFranchise(p.franchise != null ? String(p.franchise) : "");
        setPremium(p.monthly_premium != null ? String(p.monthly_premium) : "");
        setAccident(!!p.accident_coverage);
        setSupplementary(Array.isArray(p.supplementary) ? p.supplementary.join(", ") : "");
        setValidFrom(p.valid_from ?? "");
        if (p.member_id) setMemberId(p.member_id);
      }
      if (ms) {
        const mapped: Member[] = ms.map((m: any) => ({
          id: m.id, first_name: m.first_name, last_name: m.last_name, is_self: m.is_self,
        }));
        setMembers(mapped);
        setMemberId((cur) => cur || (mapped.find((m) => m.is_self)?.id ?? mapped[0]?.id ?? ""));
      }
      setLoading(false);
    })();
  }, [policyId, user]);

  const conf = (key: string): number | null => {
    const c = policy?.ocr_confidence?.[key];
    return typeof c === "number" ? c : null;
  };
  const isLowConf = (key: string) => { const c = conf(key); return c != null && c < CONFIDENCE_THRESHOLD; };

  const save = async () => {
    if (!memberId) return toast.error("Bitte wähle eine Person aus.");
    setSaving(true);
    const supp = supplementary.split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await (supabase.from("policies") as any).update({
      insurer: insurer || null,
      model: model || null,
      franchise: franchise ? parseFloat(franchise) : null,
      monthly_premium: premium ? parseFloat(premium) : null,
      accident_coverage: accident,
      supplementary: supp,
      valid_from: validFrom || null,
      member_id: memberId,
      confirmed_at: new Date().toISOString(),
    }).eq("id", policyId);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-2xl py-12 lg:py-16 px-4">
        <div className="flex items-start gap-4 mb-8">
          <VersicaIcon size="lg" />
          <div className="bg-primary-light rounded-3xl rounded-tl-md px-5 py-4 shadow-sm flex-1">
            <p className="leading-relaxed">
              {failed
                ? "Hmm, das Auslesen hat nicht geklappt. Magst du die Felder kurz manuell ausfüllen? Ich helfe dir trotzdem weiter."
                : "Hier ist, was ich aus deiner Police gelesen habe – stimmt das so? Felder mit orangem Hinweis bitte besonders prüfen."}
            </p>
          </div>
        </div>

        <p className="text-sm font-medium text-primary mb-3">Schritt 2 von 3 · Bestätigen</p>
        <h1 className="text-3xl lg:text-4xl font-semibold mb-8">Stimmen die Angaben?</h1>

        <div className="card-soft p-6 space-y-5">
          <Field label="Für welche Person?">
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
          <Field label="Versicherer" lowConf={isLowConf("insurer")}>
            <Input value={insurer} onChange={(e) => setInsurer(e.target.value)} placeholder="z. B. CSS" />
          </Field>
          <Field label="Modell" lowConf={isLowConf("model")}>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue placeholder="Modell wählen" /></SelectTrigger>
              <SelectContent>{MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Franchise (CHF)" lowConf={isLowConf("franchise_chf")}>
              <Input type="number" value={franchise} onChange={(e) => setFranchise(e.target.value)} placeholder="2500" />
            </Field>
            <Field label="Monatsprämie (CHF)" lowConf={isLowConf("monthly_premium_chf")}>
              <Input type="number" step="0.05" value={premium} onChange={(e) => setPremium(e.target.value)} placeholder="412.50" />
            </Field>
          </div>
          <Field label="Gültig ab" lowConf={isLowConf("valid_from")}>
            <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
          </Field>
          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div>
              <Label className="text-base">Unfalldeckung eingeschlossen</Label>
              {isLowConf("accident_coverage") && <p className="text-xs text-amber-600 mt-1">Bitte prüfen</p>}
            </div>
            <Switch checked={accident} onCheckedChange={setAccident} />
          </div>
          <Field label="Zusatzversicherungen (kommagetrennt)" lowConf={isLowConf("supplementary")}>
            <Input value={supplementary} onChange={(e) => setSupplementary(e.target.value)} placeholder="z. B. Spital halbprivat, Zahn" />
          </Field>
        </div>

        <div className="flex items-center justify-between mt-6 gap-3">
          <Button variant="outline" onClick={() => navigate({ to: "/police-upload" })}>Erneut hochladen</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Speichern & weiter
          </Button>
        </div>
      </main>
      <Footer />
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
