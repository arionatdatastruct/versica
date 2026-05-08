import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Check, AlertTriangle, Upload, Loader2, Pencil, ListChecks } from "lucide-react";
import { VersicaIcon } from "@/components/VersicaIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { deletePolicy } from "@/lib/policy-actions";
import { DeleteButton } from "./_authenticated.policen";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/app/dashboard")({ component: DashboardPage });

type PolicyRow = { id: string; insurer: string | null; model: string | null; monthly_premium: number | null; total_monthly_premium: number | null; kvg_monthly_premium: number | null; member_id: string | null; ocr_status: string; file_path: string | null };
type MemberRow = { id: string; first_name: string; last_name: string | null; is_self: boolean };


function DashboardPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ms }, { data: ps }] = await Promise.all([
        supabase.from("household_members")
          .select("id, first_name, last_name, is_self, household_id, households!inner(owner_id)")
          .eq("households.owner_id", user.id),
        supabase.from("policies")
          .select("id, insurer, model, monthly_premium, total_monthly_premium, kvg_monthly_premium, member_id, ocr_status, file_path")
          .eq("owner_id", user.id),
      ]);
      setMembers((ms ?? []).map((m: any) => ({ id: m.id, first_name: m.first_name, last_name: m.last_name, is_self: m.is_self })));
      setPolicies(ps ?? []);
      setLoading(false);
    })();
  }, [user]);

  const policiesByMember = new Map<string, PolicyRow[]>();
  for (const p of policies) if (p.member_id) {
    const arr = policiesByMember.get(p.member_id) ?? [];
    arr.push(p); policiesByMember.set(p.member_id, arr);
  }
  const totalMonthly = policies.reduce(
    (s, p) => s + (p.total_monthly_premium ?? p.monthly_premium ?? p.kvg_monthly_premium ?? 0),
    0,
  );

  const handleDelete = async (p: PolicyRow) => {
    try {
      await deletePolicy(p.id, p.file_path);
      setPolicies((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Police gelöscht");
    } catch (e: any) {
      toast.error("Löschen fehlgeschlagen: " + (e?.message ?? e));
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-12 space-y-10 px-4">
        <div className="flex items-start gap-4 justify-between flex-wrap">
          <div>
            <h1 className="text-3xl lg:text-4xl font-semibold mb-2">Hi {user?.user_metadata?.display_name ?? "Familie"}</h1>
            <p className="text-foreground-secondary text-sm max-w-xl">
              {policies.length === 0
                ? "Lade deine erste Police hoch, damit Versica sie für dich analysieren kann."
                : `Versica hat ${policies.length} Police(n) analysiert.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/policen"><ListChecks className="mr-2 h-4 w-4" /> Alle Policen</Link>
            </Button>
            <Button asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-6">
              <Link to="/police-upload"><Upload className="mr-2 h-4 w-4" /> Police hochladen</Link>
            </Button>
          </div>
        </div>

        <section className="bg-primary-light rounded-3xl p-8 lg:p-10 grid lg:grid-cols-[1fr_auto] gap-6 items-center relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative">
            <div className="eyebrow mb-3">Übersicht</div>
            <h2 className="text-3xl lg:text-4xl font-semibold mb-3">
              Aktuelle Prämie: <span className="text-accent">CHF {totalMonthly.toFixed(2)}/Mt</span>
            </h2>
            <p className="text-foreground-secondary">
              {policies.length > 0
                ? "Lass dir mögliche Einsparungen anzeigen."
                : "Sobald du Policen hochlädst, siehst du hier dein Einsparpotenzial."}
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-7 h-14 relative">
            <Link to="/familie-optimieren">Optimierung anzeigen <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
            <div>
              <div className="eyebrow mb-2">Familienmitglieder</div>
              <h2 className="text-3xl font-semibold">{members.length} Versicherte im Überblick</h2>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/familie">Mitglieder verwalten</Link>
            </Button>
          </div>
          {members.length === 0 ? (
            <div className="card-soft p-8 text-center text-foreground-secondary">
              Noch keine Familienmitglieder. Beim Bestätigen einer Police werden sie automatisch angelegt.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {members.map((m) => {
                const memberPolicies = policiesByMember.get(m.id) ?? [];
                const initials = (m.first_name[0] + (m.last_name?.[0] ?? "")).toUpperCase();
                const fullName = `${m.first_name}${m.last_name ? ` ${m.last_name}` : ""}`;
                const has = memberPolicies.length > 0;
                return (
                  <div key={m.id} className="card-soft p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-semibold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{fullName}</p>
                        <p className="text-sm text-foreground-secondary">{m.is_self ? "Du" : "Familienmitglied"}</p>
                      </div>
                      {has ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/15 text-success text-xs font-medium">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} /> Police geladen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-light text-accent text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Police fehlt
                        </span>
                      )}
                    </div>
                    {has ? (
                      <div className="space-y-2">
                        {memberPolicies.map((p) => {
                          const premium = p.total_monthly_premium ?? p.monthly_premium ?? p.kvg_monthly_premium;
                          return (
                            <div key={p.id} className="flex items-center justify-between gap-2 py-1">
                              <Link
                                to="/policen/$policyId"
                                params={{ policyId: p.id }}
                                className="inline-block bg-primary-light text-primary-dark px-3 py-1 rounded-full text-xs font-medium truncate hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                {p.insurer ?? "?"} · {p.model ?? "—"}
                              </Link>
                              <div className="flex items-center gap-2 shrink-0">
                                <p className="font-semibold text-sm">{premium != null ? `CHF ${premium.toFixed(2)}` : "—"}</p>
                                <Button asChild variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0" title="Bearbeiten">
                                  <Link to="/policen/$policyId" params={{ policyId: p.id }}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Link>
                                </Button>
                                <DeleteButton label={p.insurer ?? "diese Police"} onConfirm={() => handleDelete(p)} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Button asChild className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                        <Link to="/police-upload">Police für {m.first_name} hochladen</Link>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-primary-light rounded-3xl p-7">
            <div className="eyebrow mb-2">Versicherungs-Doktor</div>
            <h3 className="text-2xl font-semibold mb-3">Versica prüft eure Policen jährlich</h3>
            <p className="text-foreground-secondary mb-5">Einmal pro Jahr werden alle eure Policen automatisch geprüft – wir sagen Bescheid, wenn ein Wechsel sich lohnt.</p>
            <Button asChild variant="outline" className="rounded-full border-primary text-primary hover:bg-primary-light">
              <Link to="/check">Manuellen Check starten</Link>
            </Button>
          </div>

          <div className="card-soft p-7">
            <div className="eyebrow mb-2">Familien-Beratung</div>
            <div className="flex items-start gap-4 mb-4">
              <VersicaIcon size="md" />
              <div>
                <h3 className="text-2xl font-semibold mb-1">Frag Versica für die ganze Familie</h3>
                <p className="text-foreground-secondary text-sm">Versica kennt alle hochgeladenen Policen und gibt konkrete Empfehlungen.</p>
              </div>
            </div>
            <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/beratung">Beratung starten <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>

        <Link to="/empfehlungen" className="block bg-surface-beige rounded-3xl p-7 hover:shadow-md transition-shadow">
          <div className="grid md:grid-cols-[1fr_auto] gap-5 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.08em] font-medium text-accent mb-2">Empfehlungs-Programm</div>
              <h3 className="text-2xl font-semibold mb-2">Empfehlen, sparen, profitieren</h3>
              <p className="text-foreground-secondary">Erhaltet CHF 25 Cashback pro Person, die durch eure Empfehlung wechselt.</p>
            </div>
            <div className="flex items-center gap-2 bg-surface rounded-full pl-5 pr-2 py-2 border border-border">
              <span className="text-sm text-foreground-secondary">versica.ch/r/{user?.id?.slice(0, 8) ?? "you"}</span>
              <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Copy className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
