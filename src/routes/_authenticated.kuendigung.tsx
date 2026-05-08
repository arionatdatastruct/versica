import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VersicaIcon } from "@/components/VersicaIcon";
import { Button } from "@/components/ui/button";
import { Check, Printer, Mail, Send, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/kuendigung")({ component: Kuendigung });

function Kuendigung() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-12 max-w-[1080px] space-y-10 px-4">
        <div className="flex items-start gap-3">
          <VersicaIcon size="md" />
          <div className="bg-primary-light rounded-3xl rounded-tl-md px-5 py-4 max-w-2xl shadow-sm">
            Du hast deinen Wechsel gewählt. Versica erstellt jetzt die Schreiben für dich – du wählst nur noch, wer den Versand übernimmt.
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Schritt 3 von 3 · Wechsel abschliessen</div>
          <h1 className="text-3xl lg:text-4xl font-semibold mb-3">Versica kündigt für dich.</h1>
          <p className="text-foreground-secondary max-w-2xl">
            Beide Schreiben sind rechtssicher formuliert und auf deine Police-Daten zugeschnitten.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {[
            { eye: "Kündigung", title: "An CSS Krankenversicherung", recip: ["CSS Krankenversicherung AG", "Tribschenstrasse 21", "6005 Luzern"], subj: "Kündigung der Krankenversicherung", body: "Hiermit kündige ich meine Grundversicherung ordentlich per 31. Dezember 2026 unter Einhaltung der vertraglichen Frist." },
            { eye: "Standortschreiben", title: "An KPT Krankenkasse", recip: ["KPT Krankenkasse AG", "Wankdorfallee 3", "3014 Bern"], subj: "Bestätigung Wechsel zum 1. Januar 2027", body: "Hiermit bestätige ich die Übernahme meiner Krankenversicherung ab dem 1. Januar 2027." },
          ].map((l) => (
            <div key={l.title} className="card-soft p-7 border-l-4 border-l-primary">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <div className="eyebrow mb-1">{l.eye}</div>
                  <h3 className="text-xl font-semibold">{l.title}</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/15 text-success text-xs font-medium whitespace-nowrap">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} /> Bereit
                </span>
              </div>
              <div className="bg-surface rounded-2xl border border-border p-6 text-sm leading-relaxed shadow-sm">
                <div className="mb-5">{l.recip.map((line) => <div key={line}>{line}</div>)}</div>
                <div className="font-semibold mb-4">{l.subj}</div>
                <p className="text-foreground-secondary">{l.body}</p>
              </div>
              <div className="mt-5">
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary-light">
                  <Download className="w-4 h-4 mr-2" /> PDF herunterladen
                </Button>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-primary-light rounded-3xl p-8 lg:p-10">
          <div className="eyebrow mb-2">Versand</div>
          <h2 className="text-3xl font-semibold mb-2">Wie sollen die Schreiben rausgehen?</h2>
          <div className="grid md:grid-cols-3 gap-5 mt-6">
            {[
              { icon: Printer, eye: "Option A", title: "Ich übernehme den Versand", price: "Kostenlos" },
              { icon: Mail, eye: "Option B", title: "Versica versendet automatisch", price: "CHF 9.90", recommended: true },
              { icon: Send, eye: "Option C", title: "Elektronisch übermitteln", price: "CHF 4.90" },
            ].map((o) => (
              <div key={o.title} className={`card-soft p-6 ${o.recommended ? "border-2 border-accent" : ""}`}>
                <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
                  <o.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="eyebrow mb-1">{o.eye}</div>
                <h3 className="font-semibold text-lg mb-3">{o.title}</h3>
                <div className="text-xs font-medium text-primary mb-4">{o.price}</div>
                <Button className={o.recommended ? "w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90" : "w-full rounded-full"} variant={o.recommended ? "default" : "outline"}>
                  Wählen
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
