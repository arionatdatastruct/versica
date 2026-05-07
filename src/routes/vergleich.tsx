import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Scale, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/vergleich")({
  head: () => ({
    meta: [
      { title: "Vergleich – Versica" },
      { name: "description", content: "Vergleiche Krankenkassen anhand deiner echten Police statt abstrakter Durchschnittswerte." },
      { property: "og:title", content: "Vergleich – Versica" },
      { property: "og:description", content: "Versica vergleicht Deckungen, Kosten und Fristen passend zu deiner Situation." },
    ],
  }),
  component: VergleichPage,
});

function VergleichPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 lg:py-24">
        <p className="eyebrow mb-3">Vergleich</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight lg:text-6xl">Vergleiche Leistungen, nicht nur Prämien</h1>
        <p className="mt-5 max-w-2xl text-lg text-foreground-secondary">
          Versica nutzt deine bestehende Police als Referenz und zeigt dir Optionen mit vergleichbarer oder besserer Deckung.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { title: "Deckung", icon: Shield },
            { title: "Prämien", icon: Scale },
            { title: "Fristen", icon: BadgeCheck },
          ].map((item) => (
            <div key={item.title} className="card-soft p-7">
              <item.icon className="mb-5 h-8 w-8 text-primary" strokeWidth={2} />
              <h2 className="text-xl font-semibold">{item.title}</h2>
            </div>
          ))}
        </div>
        <Button asChild size="lg" className="mt-10 rounded-full bg-accent px-7 text-accent-foreground hover:bg-accent/90">
          <Link to="/police-upload">Vergleich starten <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
