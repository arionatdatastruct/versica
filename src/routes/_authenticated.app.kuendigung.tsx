import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/kuendigung")({ component: Kuendigung });

function Kuendigung() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-16 max-w-2xl text-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <div className="eyebrow mb-3">Kündigung</div>
        <h1 className="text-3xl lg:text-4xl font-semibold mb-4">Bald verfügbar</h1>
        <p className="text-foreground-secondary mb-8">
          Versica wird hier automatisch dein Kündigungsschreiben generieren und versandfertig vorbereiten,
          sobald die KI-Funktionen aktiviert sind.
        </p>
        <Button asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/app/dashboard">Zurück zum Dashboard</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
