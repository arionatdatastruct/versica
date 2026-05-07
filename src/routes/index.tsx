import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Heart, Lock, Server, Shield, Quote, FileText } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VersicaIcon } from "@/components/VersicaIcon";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({ component: Index });

const steps = [
  { num: "01", title: "Police hochladen", text: "Du lädst dein Versicherungsdokument hoch – PDF, Foto oder Scan. Versica liest in 30 Sekunden alles aus." },
  { num: "02", title: "Versica fragen", text: "Was zahlst du für Brillen? Ist Akupunktur gedeckt? Frag, was du willst – Versica kennt deine Police im Detail." },
  { num: "03", title: "Optimieren", text: "Versica zeigt dir günstigere Alternativen mit identischen Leistungen. Auf Wunsch übernimmt Versica auch die Kündigung." },
];

const conversations = [
  { q: "Übernimmt meine Versicherung Zahnreinigung?", a: "Die Grundversicherung zahlt Zahnreinigung in der Regel nicht. Aber ich kann dir Zusatzversicherungen mit Dental-Deckung ab CHF 18/Monat zeigen." },
  { q: "Bis wann muss ich kündigen?", a: "Für einen Wechsel auf 2027 muss deine Kündigung spätestens am 30. November 2026 bei deiner Krankenkasse sein. Eingeschrieben senden – ich helfe dir mit dem Brief." },
  { q: "Was zahle ich bei einem Spitalaufenthalt selbst?", a: "Mit deiner Franchise von CHF 2'500 trägst du diesen Betrag, danach 10 % Selbstbehalt bis maximal CHF 700 pro Jahr. Spitalaufenthalt: zusätzlich CHF 15 pro Tag." },
  { q: "Sind Auslandsreisen abgedeckt?", a: "Innerhalb Europas bist du grundgesichert. Für USA, Asien oder längere Aufenthalte empfehle ich eine Reisezusatzversicherung – ab CHF 8 pro Monat." },
  { q: "Welche Alternativmedizin ist inkludiert?", a: "Akupunktur, Homöopathie, TCM und anthroposophische Medizin sind in der Grundversicherung – aber nur bei FMH-anerkannten Therapeuten." },
  { q: "Ab welcher Franchise lohnt sich ein Wechsel?", a: "Wenn du gesund bist und unter CHF 1'800 jährlich an Gesundheitskosten hast, lohnt sich oft die Maximalfranchise von CHF 2'500." },
];

const trust = [
  { icon: Shield, label: "FINMA-registriert" },
  { icon: Lock, label: "revDSG-konform" },
  { icon: Server, label: "Schweizer Hosting" },
  { icon: Heart, label: "Provisionsfrei & unabhängig" },
];

const testimonials = [
  { name: "Markus Steiner", city: "Zürich", quote: "Versica hat mir in 2 Minuten erklärt, was meine Police wirklich abdeckt. Mein Berater hat das nie geschafft." },
  { name: "Sandra Müller", city: "Bern", quote: "Endlich verstehe ich, warum ich für die Brille meines Sohnes nichts zurückbekomme. Versica hat uns CHF 600 pro Jahr gespart." },
  { name: "Daniel Rossi", city: "Lugano", quote: "Die Frage 'Ist Akupunktur drin?' – sofort beantwortet. Mit Quellenangabe aus meiner Police." },
];

const faqs = [
  { q: "Wie sicher sind meine Police-Daten?", a: "Deine Daten werden in der Schweiz/EU AES-256 verschlüsselt gespeichert. Nie an Dritte weitergegeben, jederzeit löschbar." },
  { q: "Welche Krankenkassen kann ich vergleichen?", a: "Alle in der Schweiz zugelassenen Kassen – über 50 Anbieter, täglich mit dem BAG-Register abgeglichen." },
  { q: "Was kostet Versica?", a: "Die Grundberatung ist kostenlos. Wir verdienen erst, wenn du tatsächlich wechselst – über eine kleine Vermittlungsgebühr der neuen Kasse." },
  { q: "Wie funktioniert die automatische Kündigung?", a: "Versica generiert das passende Schreiben mit allen Fristen, du unterschreibst digital, wir versenden eingeschrieben." },
  { q: "Was ist der Unterschied zu Comparis?", a: "Comparis vergleicht abstrakt nach PLZ und Alter. Versica liest deine echte Police und vergleicht 1:1 mit identischen Leistungen." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto py-20 lg:py-28 grid lg:grid-cols-2 gap-16 items-center relative px-4">
          <div className="animate-fade-up">
            <div className="eyebrow mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" /> Persönliche KI-Beratung
            </div>
            <h1 className="text-5xl lg:text-6xl font-semibold leading-[1.1] mb-6 tracking-tight">
              Krankenkasse sortieren?{" "}
              <span className="text-primary">Versica</span>{" "}
              <span className="font-hand text-primary-dark text-6xl lg:text-7xl">hilft dir.</span>
            </h1>
            <p className="text-lg text-foreground-secondary max-w-[480px] mb-8 leading-relaxed">
              Lade deine Police hoch. Versica erklärt dir, was du wirklich versichert hast – und findet günstigere Alternativen mit identischen Leistungen.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-7 h-14 text-base shadow-md">
                <Link to="/police-upload">Police hochladen <ArrowRight className="ml-1.5 w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-2 border-primary text-primary hover:bg-primary-light hover:text-primary-dark px-7 h-14 text-base">
                <Link to="/beratung">So funktioniert's</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-foreground-tertiary">
              {["FINMA-registriert", "Schweizer Hosting", "Datenschutz nach revDSG"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} /> {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute -top-10 -right-10 w-[360px] h-[360px] rounded-full bg-primary/15 blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 -left-10 w-[280px] h-[280px] rounded-full bg-accent/10 blur-3xl opacity-50 pointer-events-none" />
            <div className="relative w-full max-w-md">
              <div className="bg-surface rounded-[28px] shadow-md p-6 border border-border">
                <div className="flex items-center gap-2 mb-5">
                  <FileText className="w-4 h-4 text-primary" strokeWidth={2} />
                  <p className="text-xs font-medium text-foreground-tertiary uppercase tracking-wider">Police_2026.pdf</p>
                </div>
                <p className="text-sm font-semibold mb-4">Krankenversicherungs-Police</p>
                <div className="space-y-2.5 text-sm">
                  {[
                    ["Versicherer", "CSS", true],
                    ["Modell", "Hausarztmodell", false],
                    ["Franchise", "CHF 2'500", true],
                    ["Brillen-Deckung", "CHF 180 / 3 J.", true],
                    ["Unfall", "Eingeschlossen", false],
                  ].map(([k, v, hl]) => (
                    <div key={k as string} className="flex justify-between py-1.5 border-b border-border/60">
                      <span className="text-foreground-secondary">{k}</span>
                      <span className={hl ? "font-semibold text-primary-dark bg-primary-light px-2 rounded-md" : "font-medium"}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -top-6 -left-10 max-w-[220px] animate-fade-up">
                <div className="bg-accent-light rounded-3xl rounded-br-md px-4 py-3 shadow-sm text-sm">
                  Wie viel zahlt mein Versicherer für Brillen?
                </div>
              </div>
              <div className="absolute -bottom-8 -right-4 max-w-[280px] animate-fade-up">
                <div className="flex items-start gap-2">
                  <VersicaIcon size="sm" />
                  <div className="bg-primary-light rounded-3xl rounded-tl-md px-4 py-3 shadow-sm text-sm">
                    CHF 180 alle 3 Jahre bei medizinischer Notwendigkeit.
                    <p className="text-xs text-foreground-tertiary mt-1">Quelle: deine Police S. 4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-20 lg:py-28 px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="eyebrow mb-3">So funktioniert's</div>
          <h2 className="text-4xl lg:text-5xl font-semibold mb-4">Drei Schritte. Versica kümmert sich um den Rest.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="card-soft p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary-dark font-semibold flex items-center justify-center text-lg mb-5">
                {s.num}
              </div>
              <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
              <p className="text-foreground-secondary leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto py-20 lg:py-24 px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="eyebrow mb-3">Echte Fragen, echte Antworten</div>
          <h2 className="text-4xl lg:text-5xl font-semibold mb-4">Endlich verständliche Antworten</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conversations.map((c, i) => (
            <div key={i} className="card-soft p-6 space-y-4 hover:shadow-lg transition-all">
              <div className="flex justify-end">
                <div className="bg-accent-light rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-[90%]">{c.q}</div>
              </div>
              <div className="flex items-start gap-3">
                <VersicaIcon size="xs" />
                <div className="bg-primary-light rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed flex-1">{c.a}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary-light/60 py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="eyebrow mb-3">Vertrauen, auf das du zählen kannst</div>
            <h2 className="text-4xl lg:text-5xl font-semibold mb-4">Schweizer Sorgfalt, von Anfang an.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trust.map((t) => (
              <div key={t.label} className="bg-surface rounded-3xl p-7 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-4">
                  <t.icon className="w-7 h-7 text-primary" strokeWidth={2} />
                </div>
                <p className="font-semibold">{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto py-20 lg:py-24 px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="eyebrow mb-3">Was unsere Nutzerinnen sagen</div>
          <h2 className="text-4xl lg:text-5xl font-semibold">Aha-Momente von echten Familien</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="card-soft p-7">
              <Quote className="w-8 h-8 text-primary mb-4" strokeWidth={2} />
              <p className="text-foreground leading-relaxed mb-6">{t.quote}</p>
              <div className="flex items-center gap-3 pt-5 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-semibold text-sm">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-foreground-tertiary">aus {t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-beige py-20 lg:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center mb-12">
            <div className="eyebrow mb-3">Häufige Fragen</div>
            <h2 className="text-4xl lg:text-5xl font-semibold">Du fragst, wir antworten</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`} className="bg-surface rounded-2xl border border-border px-6 shadow-sm">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">{f.q}</AccordionTrigger>
                <AccordionContent className="text-foreground-secondary leading-relaxed pb-5">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="container mx-auto py-24 text-center relative overflow-hidden px-4">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <VersicaIcon size="xl" className="mx-auto mb-5" />
          <div className="inline-block bg-primary-light rounded-3xl rounded-bl-sm px-5 py-3 mb-6 text-sm">
            Bereit für deine Police-Analyse?
          </div>
          <h2 className="text-4xl lg:text-5xl font-semibold mb-4 max-w-2xl mx-auto">
            Versica wartet auf deine Police.
          </h2>
          <p className="text-foreground-secondary text-lg mb-8">Kostenlos starten. Kein Abo. Keine versteckten Gebühren.</p>
          <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-14 text-base shadow-md">
            <Link to="/police-upload">Jetzt starten <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
