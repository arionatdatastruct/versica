import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VersicaIcon } from "@/components/VersicaIcon";
import { Button } from "@/components/ui/button";
import { Check, Star, Send } from "lucide-react";

export const Route = createFileRoute("/vergleich")({ component: Vergleich });

const providers = [
  { name: "KPT", initials: "KP", model: "Hausarztmodell", rating: 4.7, premium: "371.50", diff: "−CHF 41", perks: ["Gleiche Brillen-Deckung", "Mehr Alternativmedizin"] },
  { name: "Sanitas", initials: "SN", model: "Hausarztmodell", rating: 4.5, premium: "378.20", diff: "−CHF 34", perks: ["Identische Grundleistungen", "Schnellere Rückerstattung"] },
  { name: "Atupri", initials: "AT", model: "Hausarztmodell", rating: 4.6, premium: "385.00", diff: "−CHF 27", perks: ["Online-Service ausgezeichnet", "Identische Spital-Deckung"] },
  { name: "Concordia", initials: "CO", model: "Hausarztmodell", rating: 4.4, premium: "394.80", diff: "−CHF 17", perks: ["Familienrabatte", "Identische Auslandsdeckung"] },
  { name: "Swica", initials: "SW", model: "Hausarztmodell", rating: 4.8, premium: "401.00", diff: "−CHF 11", perks: ["Beste Bewertung CH", "Bonus-Programm Gesundheit"] },
];
const models = ["Standard", "HMO", "Hausarzt", "Telmed"];

function Vergleich() {
  const [active, setActive] = useState("Hausarzt");
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="bg-primary-light/70 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
              <div className="max-w-2xl">
                <div className="bg-surface rounded-3xl rounded-tl-md px-5 py-3 shadow-sm mb-4 inline-block">
                  <p className="text-sm">Hier sind die 5 Anbieter, die deiner CSS-Police am ähnlichsten sind – aber günstiger.</p>
                </div>
                <div className="eyebrow mb-2">1:1 Vergleich</div>
                <h1 className="text-3xl lg:text-4xl font-semibold mb-2">5 Anbieter mit identischen Leistungen</h1>
                <p className="text-sm text-foreground-secondary">Hausarztmodell · CHF 2'500 · 8001 Zürich · 35 Jahre</p>
              </div>
              <div className="bg-surface rounded-3xl px-7 py-6 shadow-md text-center lg:text-right">
                <p className="text-xs text-foreground-secondary mb-1">Bis zu</p>
                <p className="text-3xl font-semibold text-accent">CHF 487 / Jahr</p>
                <p className="text-sm text-foreground-secondary mt-1">sparen</p>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto py-10 px-4">
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            <aside className="card-soft p-6 lg:sticky lg:top-24 lg:self-start space-y-5">
              <h3 className="font-semibold text-lg">Filter anpassen</h3>
              <div>
                <label className="text-xs text-foreground-secondary block mb-2">Modell</label>
                <div className="flex flex-wrap gap-2">
                  {models.map((m) => (
                    <button key={m} onClick={() => setActive(m)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                        active === m ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-foreground-secondary hover:border-primary"
                      }`}>{m}</button>
                  ))}
                </div>
              </div>
              <Button className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90">Aktualisieren</Button>
            </aside>

            <section>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-foreground-secondary">5 Treffer mit identischen Leistungen</p>
              </div>
              <div className="space-y-4">
                {providers.map((p) => (
                  <div key={p.name} className="card-soft p-6 hover:border-primary transition-all">
                    <div className="grid sm:grid-cols-[80px_1fr_auto] gap-5 items-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary-light text-primary-dark font-semibold flex items-center justify-center text-lg mx-auto">{p.initials}</div>
                        <p className="font-semibold mt-2 text-sm">{p.name}</p>
                      </div>
                      <div>
                        <span className="inline-block bg-primary-light text-primary-dark px-3 py-1 rounded-full text-xs font-medium mb-2">{p.model}</span>
                        <div className="flex items-center gap-1.5 text-sm text-foreground-secondary mb-2">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {p.rating} · Kundenzufriedenheit
                        </div>
                        <ul className="space-y-1">
                          {p.perks.map((perk) => (
                            <li key={perk} className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                              <Check className="w-4 h-4 text-primary" strokeWidth={2.5} /> {perk}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">CHF {p.premium}</p>
                        <p className="text-xs text-foreground-tertiary">/ Monat</p>
                        <p className="text-sm font-semibold text-accent mt-1 mb-3">{p.diff} vs. aktuell</p>
                        <div className="flex sm:flex-col gap-2 justify-end">
                          <Button variant="outline" size="sm" className="rounded-full border-primary text-primary hover:bg-primary-light">Details</Button>
                          <Button asChild size="sm" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                            <Link to="/app/kuendigung">Wechseln</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-primary-light rounded-3xl p-6 mt-8">
                <div className="flex items-start gap-4 mb-4">
                  <VersicaIcon size="sm" />
                  <div className="bg-surface rounded-3xl rounded-tl-md px-5 py-3 shadow-sm flex-1">
                    <h3 className="font-semibold mb-1">Hast du Fragen zu einem Anbieter?</h3>
                    <p className="text-sm">Stelle Versica eine konkrete Frage.</p>
                  </div>
                </div>
                <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/beratung">Zur Beratung <Send className="w-4 h-4 ml-2" /></Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
