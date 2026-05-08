import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VersicaIcon } from "@/components/VersicaIcon";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/check")({ component: Check });

const findings = [
  { badge: "Doppelversicherung", badgeClass: "bg-accent-light text-accent", border: "border-l-accent",
    title: "Sandra zahlt doppelte Unfalldeckung",
    text: "Sandra hat Unfalldeckung in der Grundversicherung UND als Zusatzversicherung über den Arbeitgeber. Eine davon ist überflüssig.",
    detail: "Empfehlung: Unfalldeckung in der Grundversicherung ausschliessen. Spart CHF 26/Monat.",
    saving: "−CHF 312 / Jahr" },
  { badge: "Deckungslücke", badgeClass: "bg-amber-100 text-amber-700", border: "border-l-amber-500",
    title: "Tim hat keinen Auslandsschutz",
    text: "Für Reisen ausserhalb Europas reicht die Grundversicherung oft nicht.",
    detail: "Empfehlung: Reise-Zusatzversicherung für CHF 8/Monat." },
  { badge: "Einsparung", badgeClass: "bg-success/15 text-success", border: "border-l-success",
    title: "Markus könnte CHF 41/Monat sparen",
    text: "KPT bietet identische Leistungen wie Markus' aktuelle Helsana – mit besserer Service-Bewertung.",
    detail: "Versica hat den 1:1-Vergleich vorbereitet.",
    saving: "−CHF 492 / Jahr" },
];

function Check() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-12 max-w-[920px] space-y-10 px-4">
        <div className="flex items-start gap-3">
          <VersicaIcon size="md" />
          <div className="bg-primary-light rounded-3xl rounded-tl-md px-5 py-4 max-w-2xl shadow-sm">
            Versica hat alle Policen eurer Familie geprüft und Punkte gefunden, die ihr beachten solltet.
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Jahres-Check</div>
          <h1 className="text-3xl lg:text-4xl font-semibold mb-2">Euer Versicherungs-Doktor-Bericht</h1>
        </div>

        <div className="card-soft p-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { v: "4", l: "Policen geprüft" },
              { v: "2", l: "Doppelversicherungen" },
              { v: "1", l: "Deckungslücke" },
              { v: "CHF 1'820", l: "Sparpotenzial", coral: true },
            ].map((s, i) => (
              <div key={s.l} className={i > 0 ? "md:border-l border-border" : ""}>
                <p className={`text-3xl lg:text-4xl font-semibold mb-1 ${s.coral ? "text-accent" : ""}`}>{s.v}</p>
                <p className="text-xs text-foreground-secondary uppercase tracking-wider">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {findings.map((f) => (
            <div key={f.title} className={`card-soft p-7 border-l-4 ${f.border}`}>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 ${f.badgeClass}`}>{f.badge}</span>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-foreground-secondary text-sm mb-4">{f.text}</p>
              <div className="bg-primary-light rounded-2xl p-4 text-sm mb-4">{f.detail}</div>
              <div className="flex flex-wrap items-center gap-3">
                {f.saving && <p className="text-lg font-semibold text-accent">{f.saving}</p>}
                <Button className="ml-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Mehr erfahren <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
