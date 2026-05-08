import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/preise")({
  head: () => ({
    meta: [
      { title: "Preise — Versica" },
      { name: "description", content: "Versica ist kostenlos. Premium ab CHF 4.90/Monat für unbegrenzte Policen, Familien-Optimierung und automatische Kündigung." },
      { property: "og:title", content: "Preise — Versica" },
      { property: "og:description", content: "Kostenlos starten. Premium ab CHF 4.90/Monat." },
    ],
  }),
  component: PreisePage,
});

const plans = [
  {
    name: "Free",
    price: "CHF 0",
    period: "für immer",
    desc: "Verstehe deine bestehende Police. Stelle Fragen. Erhalte erste Empfehlungen.",
    cta: "Kostenlos starten",
    href: "/auth",
    highlight: false,
    features: [
      { ok: true, text: "1 Police hochladen & analysieren" },
      { ok: true, text: "Unbegrenzt Fragen an Versica" },
      { ok: true, text: "Vergleich mit anderen Kassen" },
      { ok: true, text: "Schweizer Hosting & revDSG" },
      { ok: false, text: "Familien-Optimierung" },
      { ok: false, text: "Automatischer Kündigungs-Service" },
    ],
  },
  {
    name: "Premium",
    price: "CHF 4.90",
    period: "pro Monat",
    desc: "Für Familien und Optimierer. Alles aus Free, plus die volle Versica-Power.",
    cta: "Premium testen",
    href: "/auth",
    highlight: true,
    features: [
      { ok: true, text: "Unbegrenzt Policen für die ganze Familie" },
      { ok: true, text: "Familien-Optimierung über alle Mitglieder" },
      { ok: true, text: "Automatischer Kündigungs-Service (eingeschrieben)" },
      { ok: true, text: "Frühwarnung vor Prämienerhöhungen" },
      { ok: true, text: "Persönlicher Wechsel-Support per Chat" },
      { ok: true, text: "30 Tage kostenlos testen" },
    ],
  },
];

function PreisePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="eyebrow mb-3">Preise</div>
          <h1 className="text-4xl lg:text-5xl font-semibold mb-4">Transparent. Fair. Schweizerisch.</h1>
          <p className="text-foreground-secondary text-lg">
            Kein Abo-Zwang. Keine versteckten Gebühren. Du zahlst nur, wenn dir Versica wirklich Geld spart.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-8 border ${
                p.highlight
                  ? "bg-primary text-primary-foreground border-primary shadow-xl"
                  : "bg-surface border-border shadow-sm"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 right-6 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Empfohlen
                </div>
              )}
              <h3 className="text-2xl font-semibold mb-1">{p.name}</h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-semibold">{p.price}</span>
                <span className={p.highlight ? "text-primary-foreground/80 text-sm" : "text-foreground-tertiary text-sm"}>{p.period}</span>
              </div>
              <p className={`${p.highlight ? "text-primary-foreground/90" : "text-foreground-secondary"} mb-6`}>{p.desc}</p>
              <Button
                asChild
                className={`w-full rounded-full mb-6 ${
                  p.highlight
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Link to={p.href}>
                  {p.cta} <ArrowRight className="ml-1.5 w-4 h-4" />
                </Link>
              </Button>
              <ul className="space-y-3">
                {p.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    {f.ok ? (
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.highlight ? "text-accent" : "text-primary"}`} strokeWidth={2.5} />
                    ) : (
                      <X className={`w-4 h-4 mt-0.5 shrink-0 ${p.highlight ? "text-primary-foreground/50" : "text-foreground-tertiary"}`} strokeWidth={2} />
                    )}
                    <span className={f.ok ? "" : p.highlight ? "text-primary-foreground/60" : "text-foreground-tertiary"}>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 text-sm text-foreground-tertiary">
          <p>Brauchst du eine Lösung für dein Unternehmen oder deinen Verband? <Link to="/kontakt" className="text-primary hover:underline">Kontaktiere uns</Link>.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
