import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, SearchCheck, Upload } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/beratung")({
  head: () => ({
    meta: [
      { title: "Beratung – Versica" },
      { name: "description", content: "So erklärt Versica deine Krankenversicherung verständlich und findet bessere Optionen." },
      { property: "og:title", content: "Beratung – Versica" },
      { property: "og:description", content: "KI-Beratung für deine echte Police: hochladen, fragen, optimieren." },
    ],
  }),
  component: BeratungPage,
});

function BeratungPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 lg:py-24">
        <p className="eyebrow mb-3">So funktioniert&apos;s</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight lg:text-6xl">Von der Police zur klaren Antwort</h1>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { title: "Hochladen", text: "Versica liest deine bestehende Police strukturiert aus.", icon: Upload },
            { title: "Fragen", text: "Lia beantwortet konkrete Fragen mit Bezug auf dein Dokument.", icon: MessageCircle },
            { title: "Optimieren", text: "Du siehst passende Alternativen und wichtige Kündigungsfristen.", icon: SearchCheck },
          ].map((step) => (
            <div key={step.title} className="card-soft p-7">
              <step.icon className="mb-5 h-8 w-8 text-primary" strokeWidth={2} />
              <h2 className="text-xl font-semibold">{step.title}</h2>
              <p className="mt-3 text-foreground-secondary">{step.text}</p>
            </div>
          ))}
        </div>
        <Button asChild size="lg" className="mt-10 rounded-full bg-accent px-7 text-accent-foreground hover:bg-accent/90">
          <Link to="/police-upload">Police hochladen <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
