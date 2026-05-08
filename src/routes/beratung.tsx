import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VersicaIcon } from "@/components/VersicaIcon";
import { SpeechBubble } from "@/components/SpeechBubble";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Send, FileText } from "lucide-react";

export const Route = createFileRoute("/beratung")({ component: Beratung });

const policy = {
  insurer: "CSS Krankenversicherung", model: "Hausarztmodell", franchise: "CHF 2'500",
  accident: "Eingeschlossen", start: "01.01.2024", notice: "30. November", premium: "CHF 412.50",
};
const suggestions = [
  "Was zahle ich beim Spital selbst?", "Wie viel zahlt Versica für Brillen?",
  "Ist Akupunktur abgedeckt?", "Bis wann kündigen für 2027?", "Was gilt im Ausland?",
];
const initialMessages = [
  { from: "lia", text: "Hoi! Versica hat deine CSS-Police komplett analysiert und kennt jetzt jede Deckung. Du kannst alles fragen – zum Beispiel:", chips: true },
  { from: "user", text: "Übernimmt meine Police Brillen?" },
  { from: "lia", text: "Ja, allerdings nur teilweise. Deine CSS-Grundversicherung übernimmt Sehhilfen für Erwachsene mit CHF 180 alle 3 Jahre – aber nur, wenn die Brille medizinisch nötig ist.", source: "deine Police S. 4, Sehhilfen" },
  { from: "user", text: "Wie sieht es mit Akupunktur aus?" },
  { from: "lia", text: "Akupunktur ist in deiner Grundversicherung drin – aber nur bei FMH-anerkannten Therapeuten. Versica zahlt 90% nach deiner Franchise.", source: "deine Police S. 7, Komplementärmedizin" },
] as const;

function Beratung() {
  const [input, setInput] = useState("");
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-10 px-4">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-5">
            <div className="card-soft p-6">
              <div className="flex items-center gap-3 mb-5">
                <VersicaIcon size="sm" />
                <p className="text-sm font-semibold">Versica hat deine Police analysiert</p>
              </div>
              <div className="eyebrow mb-3">Deine Police</div>
              <div className="space-y-3 text-sm">
                <div><p className="text-foreground-tertiary text-xs">Versicherer</p><p className="font-semibold">{policy.insurer}</p></div>
                <div><p className="text-foreground-tertiary text-xs mb-1">Modell</p><span className="inline-block bg-primary-light text-primary-dark px-3 py-1 rounded-full text-xs font-medium">{policy.model}</span></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-foreground-tertiary text-xs">Franchise</p><p className="font-semibold">{policy.franchise}</p></div>
                  <div><p className="text-foreground-tertiary text-xs">Unfall</p><p className="font-semibold">✓ {policy.accident}</p></div>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-foreground-tertiary text-xs">Monatliche Prämie</p>
                  <p className="text-2xl font-semibold">{policy.premium}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-5 rounded-full border-primary text-primary hover:bg-primary-light">
                <FileText className="w-4 h-4 mr-2" /> Police-Details
              </Button>
            </div>
            <div className="card-soft p-6">
              <p className="text-xs text-foreground-tertiary uppercase tracking-wider mb-3">Zusatzversicherungen</p>
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-foreground-secondary mb-3">Noch keine Zusatzversicherung erfasst</p>
              </div>
            </div>
          </aside>

          <section className="card-soft flex flex-col min-h-[80vh]">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <VersicaIcon size="sm" />
                <div>
                  <p className="font-semibold">Versica · KI-Beratung</p>
                  <p className="text-xs text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Online · Police geladen
                  </p>
                </div>
              </div>
              <Button asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/vergleich">Vergleich starten <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>

            <div className="flex-1 p-6 space-y-5 overflow-y-auto">
              {initialMessages.map((m, i) =>
                m.from === "lia" ? (
                  <div key={i}>
                    <SpeechBubble>
                      <p className="leading-relaxed">{m.text}</p>
                      {"source" in m && m.source && <p className="text-xs text-foreground-tertiary mt-2">Quelle: {m.source}</p>}
                    </SpeechBubble>
                    {"chips" in m && m.chips && (
                      <div className="ml-[52px] mt-3 flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                          <button key={s} className="text-sm px-4 py-2 rounded-full border border-accent/40 bg-accent-light/60 hover:bg-accent-light hover:border-accent transition">{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <SpeechBubble key={i} variant="user" showAvatar={false}><p>{m.text}</p></SpeechBubble>
                )
              )}
            </div>

            <div className="p-5 border-t border-border">
              <form onSubmit={(e) => { e.preventDefault(); setInput(""); }}
                className="flex items-center gap-2 bg-surface border border-border rounded-full pl-5 pr-2 py-2 shadow-sm focus-within:border-primary">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Frag mich, was du willst..."
                  className="flex-1 bg-transparent outline-none text-sm py-2" />
                <button type="submit" className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90">
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-xs text-foreground-tertiary mt-2 px-2">
                Versica gibt Auskünfte basierend auf deiner Police. Bei rechtlichen Fragen wende dich an deine Krankenkasse.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
