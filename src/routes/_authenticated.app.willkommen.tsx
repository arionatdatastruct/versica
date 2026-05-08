import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Check, Loader2, Upload, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SWISS_CANTONS } from "@/lib/family";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/willkommen")({
  component: WelcomeWizard,
});

type Step = 1 | 2 | 3;

function WelcomeWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPolicy, setHasPolicy] = useState(false);

  // Step 1 fields
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [selfMemberId, setSelfMemberId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [canton, setCanton] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: hh } = await supabase
        .from("households")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();
      if (hh) {
        setHouseholdId(hh.id);
        const { data: self } = await supabase
          .from("household_members")
          .select("id, first_name, last_name, canton, birth_date")
          .eq("household_id", hh.id)
          .eq("is_self", true)
          .limit(1)
          .maybeSingle();
        if (self) {
          setSelfMemberId(self.id);
          setFirstName(self.first_name ?? "");
          setLastName(self.last_name ?? "");
          setCanton(self.canton ?? "");
          setBirthDate(self.birth_date ?? "");
        }
      }
      const { count } = await supabase
        .from("policies")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id);
      setHasPolicy((count ?? 0) > 0);
      setLoading(false);
    })();
  }, [user]);

  const saveStep1 = async () => {
    if (!firstName.trim()) {
      toast.error("Bitte gib deinen Vornamen an.");
      return false;
    }
    setSaving(true);
    if (selfMemberId) {
      const { error } = await supabase
        .from("household_members")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          canton: canton || null,
          birth_date: birthDate || null,
        })
        .eq("id", selfMemberId);
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return false;
      }
    } else if (householdId) {
      const { data, error } = await supabase
        .from("household_members")
        .insert({
          household_id: householdId,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          canton: canton || null,
          birth_date: birthDate || null,
          is_self: true,
        })
        .select("id")
        .single();
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return false;
      }
      setSelfMemberId(data.id);
    } else {
      setSaving(false);
    }
    return true;
  };

  const finish = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { onboarded_at: new Date().toISOString() },
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Willkommen bei Versica!");
    navigate({ to: "/app/dashboard", replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-12 px-4 max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div className="eyebrow mb-2">Willkommen bei Versica</div>
          <h1 className="text-3xl lg:text-4xl font-semibold">In 3 Schritten startklar</h1>
        </div>

        <Stepper step={step} />

        <div className="card-soft p-7 mt-8">
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-light text-primary-dark flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Schritt 1 — Dein Profil</h2>
                  <p className="text-sm text-foreground-secondary">
                    So können wir Empfehlungen auf deinen Wohnkanton zuschneiden.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fn">Vorname</Label>
                  <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5 rounded-2xl" />
                </div>
                <div>
                  <Label htmlFor="ln">Nachname</Label>
                  <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5 rounded-2xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bd">Geburtsdatum</Label>
                  <Input id="bd" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="mt-1.5 rounded-2xl" />
                </div>
                <div>
                  <Label htmlFor="ct">Wohnkanton</Label>
                  <Select value={canton} onValueChange={setCanton}>
                    <SelectTrigger id="ct" className="mt-1.5 rounded-2xl"><SelectValue placeholder="Wähle…" /></SelectTrigger>
                    <SelectContent>
                      {SWISS_CANTONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={async () => { if (await saveStep1()) setStep(2); }}
                  disabled={saving}
                  className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Weiter <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-light text-primary-dark flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Schritt 2 — Erste Police</h2>
                  <p className="text-sm text-foreground-secondary">
                    Lade deine Krankenkassen-Police als PDF hoch. Versica liest sie automatisch aus.
                  </p>
                </div>
              </div>
              {hasPolicy ? (
                <div className="rounded-2xl bg-success/10 text-success p-4 flex items-center gap-3">
                  <Check className="w-5 h-5" /> Police bereits hochgeladen.
                </div>
              ) : (
                <Button asChild className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 h-12">
                  <Link to="/app/police-upload">
                    <Upload className="w-4 h-4 mr-2" /> Police hochladen
                  </Link>
                </Button>
              )}
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-full">Zurück</Button>
                <Button onClick={() => setStep(3)} className="rounded-full" variant="outline">
                  {hasPolicy ? "Weiter" : "Überspringen"} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-light text-primary-dark flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Schritt 3 — Empfehlungen</h2>
                  <p className="text-sm text-foreground-secondary">
                    Sobald deine Police bestätigt ist, zeigen wir dir konkrete Sparpotenziale.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-primary-light p-5">
                <p className="font-medium mb-1">Was dich erwartet:</p>
                <ul className="text-sm text-foreground-secondary space-y-1.5 list-disc pl-5">
                  <li>Franchise-Optimierung (CHF 300 vs. 2'500)</li>
                  <li>Alternative Modelle (Telmed, Hausarzt, HMO)</li>
                  <li>Unfalldeckung prüfen, wenn dein Arbeitgeber sie übernimmt</li>
                  <li>Vergleich mit dem günstigsten Anbieter in deinem Kanton</li>
                </ul>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)} className="rounded-full">Zurück</Button>
                <Button onClick={finish} disabled={saving} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Zum Dashboard <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <button onClick={finish} className="text-xs text-foreground-tertiary underline hover:text-foreground-secondary">
            Onboarding ganz überspringen
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const items = [
    { n: 1, label: "Profil" },
    { n: 2, label: "Police" },
    { n: 3, label: "Empfehlungen" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {items.map((it, i) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <div key={it.n} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  done
                    ? "bg-success text-background"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground-secondary"
                }`}
              >
                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : it.n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${active ? "text-foreground" : "text-foreground-secondary"}`}>
                {it.label}
              </span>
            </div>
            {i < items.length - 1 && <div className="w-6 sm:w-10 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
