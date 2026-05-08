import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingDown, AlertCircle, Upload, Loader2, ArrowRight, Check, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateAge } from "@/lib/family";

export const Route = createFileRoute("/_authenticated/app/empfehlungen")({
  component: EmpfehlungenPage,
});

type PolicyRow = {
  id: string;
  insurer: string | null;
  policy_type: string | null;
  kvg_model: string | null;
  model: string | null;
  kvg_franchise: number | null;
  franchise: number | null;
  kvg_accident_coverage: boolean | null;
  accident_coverage: boolean | null;
  kvg_monthly_premium: number | null;
  monthly_premium: number | null;
  total_monthly_premium: number | null;
  vvg_total_monthly_premium: number | null;
  vvg_products: unknown;
  member_id: string | null;
  insured_first_name: string | null;
  insured_last_name: string | null;
  insured_birth_date: string | null;
  confirmed_at: string | null;
};

type MemberRow = {
  id: string;
  first_name: string;
  last_name: string | null;
  birth_date: string | null;
  is_self: boolean;
};

type Severity = "high" | "medium" | "info";

type Recommendation = {
  id: string;
  title: string;
  description: string;
  estimatedSavingsChf: number; // per year
  severity: Severity;
  policyId?: string;
  memberName?: string;
  cta?: { label: string; to: string };
};

function EmpfehlungenPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ps }, { data: ms }] = await Promise.all([
        supabase
          .from("policies")
          .select(
            "id, insurer, policy_type, kvg_model, model, kvg_franchise, franchise, kvg_accident_coverage, accident_coverage, kvg_monthly_premium, monthly_premium, total_monthly_premium, vvg_total_monthly_premium, vvg_products, member_id, insured_first_name, insured_last_name, insured_birth_date, confirmed_at",
          )
          .eq("owner_id", user.id),
        supabase
          .from("household_members")
          .select("id, first_name, last_name, birth_date, is_self, household_id, households!inner(owner_id)")
          .eq("households.owner_id", user.id),
      ]);
      setPolicies((ps ?? []) as PolicyRow[]);
      setMembers(((ms ?? []) as any[]).map((m) => ({
        id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
        birth_date: m.birth_date,
        is_self: m.is_self,
      })));
      setLoading(false);
    })();
  }, [user]);

  const recommendations = useMemo(() => buildRecommendations(policies, members), [policies, members]);

  const totalSavings = recommendations.reduce((s, r) => s + r.estimatedSavingsChf, 0);

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
      <main className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="mb-10">
          <div className="eyebrow mb-2">Empfehlungen</div>
          <h1 className="text-3xl lg:text-4xl font-semibold mb-3">Dein Sparpotenzial</h1>
          <p className="text-foreground-secondary max-w-2xl">
            Versica analysiert deine bestätigten Policen und schlägt konkrete Anpassungen vor —
            basierend auf Schweizer Krankenkassen-Standards.
          </p>
        </div>

        {policies.length === 0 ? (
          <EmptyState
            icon={<Upload className="w-8 h-8 text-primary" />}
            title="Noch keine Policen vorhanden"
            description="Lade deine erste Police hoch, damit Versica Empfehlungen berechnen kann."
            cta={{ label: "Police hochladen", to: "/app/police-upload" }}
          />
        ) : recommendations.length === 0 ? (
          <EmptyState
            icon={<Check className="w-8 h-8 text-success" />}
            title="Alles im grünen Bereich"
            description="Wir haben keine Optimierungen gefunden. Sobald sich Tarife oder deine Lebenssituation ändern, melden wir uns."
            cta={{ label: "Zum Dashboard", to: "/app/dashboard" }}
          />
        ) : (
          <>
            <div className="bg-primary-light rounded-3xl p-7 lg:p-9 mb-8 grid lg:grid-cols-[1fr_auto] gap-5 items-center relative overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
              <div className="relative">
                <div className="eyebrow mb-2">Geschätztes Sparpotenzial</div>
                <h2 className="text-3xl lg:text-4xl font-semibold">
                  Bis zu <span className="text-accent">CHF {totalSavings.toLocaleString("de-CH", { maximumFractionDigits: 0 })}/Jahr</span>
                </h2>
                <p className="text-foreground-secondary mt-2 text-sm">
                  {recommendations.length} Empfehlung{recommendations.length === 1 ? "" : "en"} —
                  Schätzung basierend auf Schweizer Durchschnittswerten.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {recommendations.map((r) => (
                <RecommendationCard key={r.id} rec={r} />
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-border p-5 flex items-start gap-3 bg-surface">
              <Info className="w-4 h-4 text-foreground-tertiary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Die Schätzungen sind Richtwerte aus Schweizer Krankenkassen-Daten und ersetzen keine
                individuelle Beratung. Tatsächliche Einsparungen hängen von deinem Anbieter und Kanton ab.
              </p>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const sevStyles: Record<Severity, string> = {
    high: "bg-accent/15 text-accent",
    medium: "bg-warning/15 text-warning",
    info: "bg-primary-light text-primary-dark",
  };
  const sevIcon: Record<Severity, JSX.Element> = {
    high: <TrendingDown className="w-5 h-5" />,
    medium: <AlertCircle className="w-5 h-5" />,
    info: <Sparkles className="w-5 h-5" />,
  };
  return (
    <div className="card-soft p-6 grid md:grid-cols-[auto_1fr_auto] gap-5 items-start">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${sevStyles[rec.severity]}`}>
        {sevIcon[rec.severity]}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="text-lg font-semibold">{rec.title}</h3>
          {rec.memberName && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground-secondary">
              {rec.memberName}
            </span>
          )}
        </div>
        <p className="text-foreground-secondary text-sm">{rec.description}</p>
        {rec.cta && (
          <Button asChild variant="link" className="px-0 h-auto mt-2 text-primary">
            <Link to={rec.cta.to}>
              {rec.cta.label} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        )}
      </div>
      <div className="text-right md:text-right md:min-w-[120px]">
        <p className="text-2xl font-semibold text-accent">
          CHF {rec.estimatedSavingsChf.toLocaleString("de-CH", { maximumFractionDigits: 0 })}
        </p>
        <p className="text-xs text-foreground-secondary">geschätzt / Jahr</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  cta,
}: {
  icon: JSX.Element;
  title: string;
  description: string;
  cta: { label: string; to: string };
}) {
  return (
    <div className="card-soft p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-foreground-secondary mb-6 max-w-md mx-auto">{description}</p>
      <Button asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
        <Link to={cta.to as any}>{cta.label}</Link>
      </Button>
    </div>
  );
}

// --- Recommendation engine -------------------------------------------------

function buildRecommendations(policies: PolicyRow[], members: MemberRow[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Members without confirmed policy
  const memberPolicyCount = new Map<string, number>();
  for (const p of policies) {
    if (p.member_id && p.confirmed_at) {
      memberPolicyCount.set(p.member_id, (memberPolicyCount.get(p.member_id) ?? 0) + 1);
    }
  }
  for (const m of members) {
    if ((memberPolicyCount.get(m.id) ?? 0) === 0) {
      recs.push({
        id: `missing-${m.id}`,
        title: `Police für ${m.first_name} fehlt`,
        description:
          "Ohne Police können wir keine Optimierung berechnen. Lade die aktuelle Krankenkassen-Police hoch.",
        estimatedSavingsChf: 0,
        severity: "info",
        memberName: `${m.first_name}${m.last_name ? ` ${m.last_name}` : ""}`,
        cta: { label: "Police hochladen", to: "/app/police-upload" },
      });
    }
  }

  // Per-policy rules (only confirmed)
  for (const p of policies) {
    if (!p.confirmed_at) continue;
    const member = p.member_id ? memberMap.get(p.member_id) : undefined;
    const memberName = member
      ? `${member.first_name}${member.last_name ? ` ${member.last_name}` : ""}`
      : [p.insured_first_name, p.insured_last_name].filter(Boolean).join(" ") || undefined;

    const birth = member?.birth_date ?? p.insured_birth_date;
    const age = calculateAge(birth);
    const isAdult = age != null && age >= 26;
    const isYouth = age != null && age >= 19 && age < 26;

    const franchise = p.kvg_franchise ?? p.franchise;
    const monthlyKvg = p.kvg_monthly_premium ?? p.monthly_premium ?? 0;
    const model = (p.kvg_model ?? p.model ?? "").toLowerCase();
    const accident = p.kvg_accident_coverage ?? p.accident_coverage;

    // Rule 1: Low franchise for adults → switch to 2500
    if (isAdult && franchise != null && franchise < 2500 && monthlyKvg > 0) {
      // Rough estimate: each step up saves ~CHF 140-260/year; from 300→2500 ≈ CHF 1100
      const savings = Math.round(((2500 - franchise) / 2200) * 1100);
      if (savings >= 100) {
        recs.push({
          id: `franchise-${p.id}`,
          title: "Franchise erhöhen",
          description: `Aktuell CHF ${franchise.toFixed(0)}. Eine Erhöhung auf CHF 2'500 lohnt sich, wenn du selten zum Arzt gehst.`,
          estimatedSavingsChf: savings,
          severity: "high",
          policyId: p.id,
          memberName,
          cta: { label: "Police ansehen", to: "/app/policen" },
        });
      }
    }

    // Rule 2: Standard model → alternative model
    const isStandard = model.includes("standard") || model === "" || model.includes("freie");
    if (isStandard && monthlyKvg > 0 && (isAdult || isYouth)) {
      const savings = Math.round(monthlyKvg * 12 * 0.15);
      if (savings >= 100) {
        recs.push({
          id: `model-${p.id}`,
          title: "Alternatives Modell prüfen",
          description:
            "Mit Telmed, Hausarzt- oder HMO-Modell sparst du im Schnitt 10–20 % bei sehr ähnlicher Versorgung.",
          estimatedSavingsChf: savings,
          severity: "high",
          policyId: p.id,
          memberName,
          cta: { label: "Police ansehen", to: "/app/policen" },
        });
      }
    }

    // Rule 3: Accident coverage on while likely employed (adults)
    if (isAdult && accident === true && monthlyKvg > 0) {
      // Removing accident coverage saves ~7% of KVG premium
      const savings = Math.round(monthlyKvg * 12 * 0.07);
      if (savings >= 80) {
        recs.push({
          id: `accident-${p.id}`,
          title: "Unfalldeckung in der Grundversicherung prüfen",
          description:
            "Wenn du mind. 8 h/Woche arbeitest, ist Unfall meist über den Arbeitgeber gedeckt. Entfernen spart Prämie.",
          estimatedSavingsChf: savings,
          severity: "medium",
          policyId: p.id,
          memberName,
          cta: { label: "Police ansehen", to: "/app/policen" },
        });
      }
    }

    // Rule 4: VVG over CHF 100/Mt — review supplementary
    const vvg = p.vvg_total_monthly_premium ?? 0;
    if (vvg >= 100) {
      recs.push({
        id: `vvg-${p.id}`,
        title: "Zusatzversicherungen überprüfen",
        description: `Du zahlst CHF ${vvg.toFixed(0)}/Mt für Zusätze. Prüfe, welche Leistungen du wirklich nutzt.`,
        estimatedSavingsChf: Math.round(vvg * 12 * 0.25),
        severity: "medium",
        policyId: p.id,
        memberName,
        cta: { label: "Police ansehen", to: "/app/policen" },
      });
    }
  }

  // Duplicates
  const dup = new Map<string, string[]>();
  for (const p of policies) {
    const key = [
      (p.insurer ?? "").toLowerCase().trim(),
      p.member_id ?? "",
      p.kvg_model ?? "",
    ].join("|");
    if (!key.replace(/\|/g, "")) continue;
    const arr = dup.get(key) ?? [];
    arr.push(p.id);
    dup.set(key, arr);
  }
  for (const ids of dup.values()) {
    if (ids.length > 1) {
      recs.push({
        id: `dup-${ids[0]}`,
        title: "Mögliches Duplikat",
        description: `${ids.length} sehr ähnliche Policen gefunden. Prüfe und lösche Duplikate, damit die Übersicht stimmt.`,
        estimatedSavingsChf: 0,
        severity: "info",
        cta: { label: "Policen prüfen", to: "/app/policen" },
      });
    }
  }

  // Sort: highest savings first, info-only last
  return recs.sort((a, b) => {
    if (a.estimatedSavingsChf !== b.estimatedSavingsChf) {
      return b.estimatedSavingsChf - a.estimatedSavingsChf;
    }
    const sevOrder = { high: 0, medium: 1, info: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });
}
