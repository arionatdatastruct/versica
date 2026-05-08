import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/empfehlungen")({ component: Empfehlungen });

function Empfehlungen() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-16 max-w-2xl text-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div className="eyebrow mb-3">Empfehlungs-Programm</div>
        <h1 className="text-3xl lg:text-4xl font-semibold mb-4">Bald verfügbar</h1>
        <p className="text-foreground-secondary mb-8">
          Sobald du Policen hochgeladen hast und Versica die KI-Auswertung bereitstellt, erhältst du
          hier deinen persönlichen Empfehlungslink und kannst Cashback verdienen.
        </p>
        <Button asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/dashboard">Zurück zum Dashboard</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
