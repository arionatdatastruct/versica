import { createFileRoute } from "@tanstack/react-router";
import { FileUp, Lock } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/police-upload")({
  component: PolicyUploadPage,
});

function PolicyUploadPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12 lg:py-16">
        <p className="eyebrow mb-3">Police-Check</p>
        <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">Police hochladen</h1>
        <p className="mt-4 text-foreground-secondary">
          Lade dein PDF, Foto oder Scan hoch. Die KI-Extraktion wird im nächsten Schritt mit Lovable Cloud verbunden.
        </p>

        <div className="card-soft mt-10 border-dashed p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-light">
            <FileUp className="h-8 w-8 text-primary" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-semibold">Dokument auswählen</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-foreground-secondary">
            PDF, PNG oder JPG. Deine Datei bleibt geschützt und wird nur für deine Analyse verwendet.
          </p>
          <Button className="mt-6 rounded-full bg-accent px-7 text-accent-foreground hover:bg-accent/90">
            Datei auswählen
          </Button>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-foreground-tertiary">
            <Lock className="h-3.5 w-3.5" /> Verschlüsselte Verarbeitung
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
