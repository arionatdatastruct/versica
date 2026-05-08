import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VersicaIcon } from "@/components/VersicaIcon";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Heart, Award, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/familie-optimieren")({ component: FamilieOptimieren });

const current = [
  { initials: "MM", name: "Markus Müller", insurer: "Helsana · Hausarzt", premium: "CHF 412.50/Mt" },
  { initials: "SM", name: "Sandra Müller", insurer: "CSS · Standard", premium: "CHF 389.00/Mt" },
  { initials: "LM", name: "Lina Müller", insurer: "Helsana · Kindertarif", premium: "CHF 142.00/Mt" },
  { initials: "TM", name: "Tim Müller", insurer: "Helsana · Kindertarif", premium: "CHF 138.00/Mt" },
];
const optimized = [
  { initials: "MM", name: "Markus Müller", insurer: "KPT · Hausarzt", premium: "CHF 371.00/Mt", note: "Beste Service-Qualität" },
  { initials: "SM", name: "Sandra Müller", insurer: "Atupri · Telmed", premium: "CHF 348.00/Mt", note: "24h Telemedizin" },
  { initials: "LM", name: "Lina Müller", insurer: "Sanitas · Familie", premium: "CHF 132.00/Mt", note: "Familien-Rabatt 8%" },
  { initials: "TM", name: "Tim Müller", insurer: "Sanitas · Familie", premium: "CHF 129.00/Mt", note: "Familien-Rabatt 8%" },
];

function MemberRow({ m, opt }: { m: { initials: string; name: string; insurer: string; premium: string; note?: string }; opt?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <div className="w-10 h-10 rounded-full bg-primary-light text-primary-dark text-xs font-semibold flex items-center justify-center flex-shrink-0">{m.initials}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{m.name}</p>
        <p className="text-xs text-foreground-secondary">{m.insurer}</p>
        {m.note && <p className="text-xs text-success mt-1 flex items-center gap-1"><Check className="w-3 h-3" strokeWidth={3} /> {m.note}</p>}
      </div>
      <p className={`text-sm font-semibold whitespace-nowrap ${opt ? "text-success" : ""}`}>{m.premium}</p>
    </div>
  );
}

function FamilieOptimieren() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-12 max-w-[1280px] space-y-10 px-4">
        <div className="flex items-start gap-3">
          <VersicaIcon size="md" />
          <div className="bg-primary-light rounded-3xl rounded-tl-md px-5 py-4 max-w-2xl shadow-sm">
            Versica hat alle 4 Policen eurer Familie analysiert und eine optimale Verteilung berechnet.
          </div>
        </div>

        <section className="bg-primary-light rounded-[32px] p-8 lg:p-12 grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="eyebrow mb-3">Optimierungspotenzial</div>
            <h1 className="text-4xl lg:text-5xl font-semibold mb-3">So spart eure Familie maximal</h1>
            <p className="text-foreground-secondary max-w-xl">
              Basierend auf 4 Familienmitgliedern, individuellen Bedürfnissen und Familien-Rabatten.
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl lg:text-6xl font-bold text-accent leading-none">CHF 2'340</p>
            <p className="text-sm text-foreground-secondary mt-2">/ Jahr Ersparnis</p>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1fr_220px_1fr] gap-6 items-stretch">
          <div className="card-soft p-6">
            <div className="eyebrow mb-1 text-foreground-secondary">Aktuell</div>
            <p className="text-2xl font-semibold mb-4">CHF 13'457 / Jahr</p>
            <div>{current.map((m) => <MemberRow key={m.name} m={m} />)}</div>
          </div>
          <div className="flex lg:flex-col items-center justify-center gap-3 py-6">
            <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center">
              <ArrowRight className="w-7 h-7 text-accent" strokeWidth={2} />
            </div>
            <span className="px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold">−CHF 2'340</span>
            <span className="px-4 py-1.5 rounded-full bg-success/15 text-success text-sm font-semibold">−17%</span>
          </div>
          <div className="card-soft p-6 border-2 border-primary">
            <div className="eyebrow mb-1">Versica-Empfehlung</div>
            <p className="text-2xl font-semibold mb-4 text-success">CHF 11'117 / Jahr</p>
            <div>{optimized.map((m) => <MemberRow key={m.name} m={m} opt />)}</div>
          </div>
        </section>

        <section>
          <div className="mb-6">
            <div className="eyebrow mb-2">Warum diese Verteilung?</div>
            <h2 className="text-3xl font-semibold">Versica's Logik in 3 Punkten</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Users, title: "Familien-Rabatt nutzen", text: "Wenn Lina und Tim bei Sanitas zusammenziehen, gilt der Familien-Rabatt von 8%." },
              { icon: Heart, title: "Bedarfsbasiert verteilen", text: "Sandra nutzt häufig Telemedizin. Atupri ist 24h erreichbar und 41 CHF günstiger." },
              { icon: Award, title: "Qualität priorisieren", text: "Markus erhält bei KPT die beste Bewertung (4.7) und spart CHF 41/Monat." },
            ].map((c) => (
              <div key={c.title} className="card-soft p-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
                  <c.icon className="w-6 h-6 text-primary" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-foreground-secondary">{c.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center py-10">
          <div className="flex justify-center mb-5"><VersicaIcon size="lg" /></div>
          <h2 className="text-3xl font-semibold mb-3">Bereit für die Optimierung?</h2>
          <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-7 h-14">
            <Link to="/kuendigung">Alle 4 Wechsel starten <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
