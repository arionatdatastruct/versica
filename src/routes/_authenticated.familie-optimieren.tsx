import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/familie-optimieren")({ component: FamilieOptimieren });

function FamilieOptimieren() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-16 max-w-2xl text-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <div className="eyebrow mb-3">Familien-Optimierung</div>
        <h1 className="text-3xl lg:text-4xl font-semibold mb-4">Bald verfügbar</h1>
        <p className="text-foreground-secondary mb-8">
          Sobald die Policen aller Familienmitglieder hochgeladen sind, berechnet Versica
          mithilfe der KI die optimale Verteilung – inklusive Familien-Rabatten und Empfehlungen.
        </p>
        <Button asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/dashboard">Zurück zum Dashboard</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
