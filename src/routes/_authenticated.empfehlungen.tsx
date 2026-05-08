import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VersicaIcon } from "@/components/VersicaIcon";
import { Button } from "@/components/ui/button";
import { Copy, Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/empfehlungen")({ component: Empfehlungen });

const stats = [
  { v: "12", l: "Eingeladen", sub: "Insgesamt verschickt" },
  { v: "5", l: "Registriert", sub: "Account erstellt" },
  { v: "3", l: "Abgeschlossen", sub: "Wechsel vollzogen" },
  { v: "CHF 75", l: "Verdient", sub: "Bereit zur Auszahlung", coral: true },
];

function Empfehlungen() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-12 max-w-[1080px] space-y-10 px-4">
        <div className="flex items-start gap-3">
          <VersicaIcon size="md" />
          <div className="bg-primary-light rounded-3xl rounded-tl-md px-5 py-4 max-w-2xl shadow-sm">
            Du hast schon 12 Personen eingeladen – 3 davon haben einen Wechsel über Versica abgeschlossen.
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Empfehlungs-Programm</div>
          <h1 className="text-3xl lg:text-4xl font-semibold mb-3">Empfehlen, sparen, profitieren</h1>
          <p className="text-foreground-secondary max-w-xl">
            Erhalte CHF 25 Cashback pro Person, die durch deine Empfehlung wechselt. Keine Obergrenze.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.l} className={`card-soft p-6 ${s.coral ? "border-2 border-accent" : ""}`}>
              <p className={`text-3xl font-semibold mb-2 ${s.coral ? "text-accent" : ""}`}>{s.v}</p>
              <p className={`text-xs uppercase tracking-wider font-medium mb-1 ${s.coral ? "text-accent" : "text-primary"}`}>{s.l}</p>
              <p className="text-xs text-foreground-secondary">{s.sub}</p>
            </div>
          ))}
        </div>

        <section className="bg-primary-light rounded-3xl p-7 lg:p-8">
          <div className="eyebrow mb-2">Dein persönlicher Link</div>
          <h2 className="text-2xl font-semibold mb-5">Teile Versica mit deinen Liebsten</h2>
          <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-center">
            <input readOnly value="https://versica.ch/r/mueller-2026"
              className="w-full px-5 py-3 rounded-full border-2 border-primary/40 bg-surface text-sm" />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-full border-primary text-primary"><Copy className="w-4 h-4 mr-2" /> Kopieren</Button>
              <Button variant="outline" className="rounded-full border-primary text-primary"><MessageCircle className="w-4 h-4 mr-2" /> WhatsApp</Button>
              <Button variant="outline" className="rounded-full border-primary text-primary"><Mail className="w-4 h-4 mr-2" /> E-Mail</Button>
            </div>
          </div>
        </section>

        <section className="card-soft p-7 border-2 border-accent/60">
          <div className="eyebrow mb-2 text-accent">Auszahlung</div>
          <h2 className="text-2xl font-semibold mb-2">Dein Guthaben</h2>
          <p className="text-4xl font-semibold mb-1">CHF 75.00</p>
          <p className="text-xs text-success mb-6">Mindestauszahlung ab CHF 50.00 ✓</p>
          <Button className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 h-12">Auszahlen</Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
