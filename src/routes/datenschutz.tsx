import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutz — Versica" },
      { name: "description", content: "Wie Versica deine Daten gemäss revDSG verarbeitet, speichert und schützt." },
      { property: "og:title", content: "Datenschutzerklärung — Versica" },
      { property: "og:description", content: "revDSG-konforme Datenverarbeitung — transparent erklärt." },
    ],
  }),
  component: DatenschutzPage,
});

function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20 max-w-3xl">
        <div className="eyebrow mb-3">Rechtliches</div>
        <h1 className="text-4xl lg:text-5xl font-semibold mb-8">Datenschutzerklärung</h1>
        <p className="text-sm text-foreground-tertiary mb-10">Stand: 8. Mai 2026</p>

        <div className="prose prose-neutral max-w-none space-y-8 text-foreground-secondary leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">1. Verantwortliche Stelle</h2>
            <p>Versica AG, 8001 Zürich, Schweiz. E-Mail: <a href="mailto:datenschutz@versica.ch" className="text-primary hover:underline">datenschutz@versica.ch</a></p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">2. Welche Daten wir verarbeiten</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Stammdaten: Name, E-Mail, Wohnkanton, Geburtsdatum (für Vergleichsberechnungen)</li>
              <li>Versicherungsdaten: Police-Dokumente, Versicherer, Modell, Franchise, Zusatzversicherungen</li>
              <li>Nutzungsdaten: Zugriffszeit, IP-Adresse, Browser (technisch notwendig)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">3. Zweck der Verarbeitung</h2>
            <p>Wir verarbeiten deine Daten ausschliesslich, um dir die Versica-Beratung zu ermöglichen — insbesondere zur Auswertung deiner Police, zum Vergleich mit anderen Anbietern und zur Erstellung von Optimierungsvorschlägen.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">4. Speicherort & Sicherheit</h2>
            <p>Alle Daten werden auf Servern in der Schweiz und der EU gespeichert. Police-Dokumente sind AES-256-verschlüsselt. Zugriffe erfolgen ausschliesslich über TLS 1.3.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">5. Weitergabe an Dritte</h2>
            <p>Eine Weitergabe an Dritte erfolgt nur, wenn du aktiv einen Wechsel oder eine Kündigung autorisierst. In diesem Fall werden ausschliesslich die für den Vorgang nötigen Daten an die jeweilige Versicherung übermittelt.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">6. Deine Rechte (revDSG)</h2>
            <p>Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Datenportabilität. Anfragen richtest du an <a href="mailto:datenschutz@versica.ch" className="text-primary hover:underline">datenschutz@versica.ch</a>.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">7. Cookies</h2>
            <p>Wir verwenden ausschliesslich technisch notwendige Cookies für die Sitzungsverwaltung. Es findet kein Tracking durch Drittanbieter statt.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">8. Aufsichtsbehörde</h2>
            <p>Bei Beanstandungen kannst du dich an den Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) wenden: <a href="https://www.edoeb.admin.ch" className="text-primary hover:underline" target="_blank" rel="noreferrer">edoeb.admin.ch</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
