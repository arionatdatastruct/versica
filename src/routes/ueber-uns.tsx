import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Shield, Users, Lightbulb, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ueber-uns")({
  head: () => ({
    meta: [
      { title: "Über uns — Versica" },
      { name: "description", content: "Versica macht Schweizer Krankenversicherungen verständlich. Unabhängig, FINMA-registriert, in der Schweiz gehostet." },
      { property: "og:title", content: "Über uns — Versica" },
      { property: "og:description", content: "Schweizer KI-Beratung, die dir gehört — nicht den Versicherern." },
    ],
  }),
  component: UeberUnsPage,
});

const values = [
  { icon: Heart, title: "Unabhängig", text: "Wir verdienen nur, wenn du wechselst — nicht über versteckte Provisionen einzelner Anbieter." },
  { icon: Shield, title: "Sicher", text: "Schweizer Hosting, AES-256-Verschlüsselung, revDSG-konform. Deine Police verlässt nie die Schweiz." },
  { icon: Users, title: "Familienfreundlich", text: "Versica versteht, dass Krankenkasse Haushaltsthema ist — nicht ein Excel-Sheet pro Person." },
  { icon: Lightbulb, title: "Verständlich", text: "Keine Versicherungs-Buzzwords. Versica erklärt deine Police, wie es ein guter Freund tun würde." },
];

function UeberUnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="container mx-auto px-4 py-20 lg:py-28 max-w-3xl text-center">
          <div className="eyebrow mb-3">Über Versica</div>
          <h1 className="text-4xl lg:text-5xl font-semibold mb-6 leading-tight">
            Wir bauen die Krankenkassen-Beratung, die wir uns selbst gewünscht hätten.
          </h1>
          <p className="text-foreground-secondary text-lg leading-relaxed">
            Versica wurde 2026 in der Schweiz gegründet, weil wir es satt hatten, jährlich
            stundenlang Policen zu vergleichen, ohne wirklich zu verstehen, was wir kaufen.
            Unsere KI liest deine echte Police — nicht eine Schätzung nach PLZ und Alter.
          </p>
        </section>

        <section className="bg-primary-light/40 py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <div className="eyebrow mb-3">Wofür wir stehen</div>
              <h2 className="text-3xl lg:text-4xl font-semibold">Vier Werte, kein Kompromiss</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((v) => (
                <div key={v.title} className="bg-surface rounded-3xl p-7 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
                    <v.icon className="w-6 h-6 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                  <p className="text-foreground-secondary leading-relaxed">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 max-w-3xl">
          <div className="card-soft p-8 lg:p-10">
            <div className="eyebrow mb-3">Regulierung</div>
            <h2 className="text-2xl lg:text-3xl font-semibold mb-4">FINMA-registriert</h2>
            <p className="text-foreground-secondary leading-relaxed mb-4">
              Versica AG ist als ungebundener Versicherungsvermittler bei der Eidgenössischen
              Finanzmarktaufsicht (FINMA) registriert. Das bedeutet: Wir vertreten ausschliesslich
              dich — nicht eine Versicherung. Wir sind verpflichtet, transparent über unsere
              Vergütung zu informieren.
            </p>
            <p className="text-sm text-foreground-tertiary">
              Sitz: Zürich, Schweiz · Handelsregister-Nr. CHE-XXX.XXX.XXX
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold mb-4">Bereit, deine Police zu verstehen?</h2>
          <p className="text-foreground-secondary mb-8">Versica wartet auf dich.</p>
          <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-14">
            <Link to="/auth">Kostenlos starten <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
