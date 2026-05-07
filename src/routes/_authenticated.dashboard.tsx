import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Home, ShieldCheck, Upload } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 lg:py-16">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-3">Familien-Dashboard</p>
            <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">Deine Versicherungen auf einen Blick</h1>
            <p className="mt-4 max-w-2xl text-foreground-secondary">
              Sobald deine Police analysiert ist, findest du hier Deckungen, Fristen und Optimierungsvorschläge.
            </p>
          </div>
          <Button asChild className="rounded-full bg-accent px-6 text-accent-foreground hover:bg-accent/90">
            <Link to="/police-upload">
              <Upload className="mr-2 h-4 w-4" /> Police hochladen
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            { label: "Policen", value: "0", icon: FileText },
            { label: "Haushalt", value: "Bereit", icon: Home },
            { label: "Datenschutz", value: "Aktiv", icon: ShieldCheck },
          ].map((item) => (
            <div key={item.label} className="card-soft p-7">
              <item.icon className="mb-5 h-7 w-7 text-primary" strokeWidth={2} />
              <p className="text-sm text-foreground-secondary">{item.label}</p>
              <p className="mt-1 text-3xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
