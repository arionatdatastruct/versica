import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum — Versica" },
      { name: "description", content: "Rechtliche Angaben zu Versica AG, dem Schweizer Anbieter für KI-gestützte Krankenkassen-Beratung." },
      { property: "og:title", content: "Impressum — Versica" },
      { property: "og:description", content: "Rechtliche Angaben gemäss Schweizer Recht." },
    ],
  }),
  component: ImpressumPage,
});

function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20 max-w-3xl">
        <div className="eyebrow mb-3">Rechtliches</div>
        <h1 className="text-4xl lg:text-5xl font-semibold mb-10">Impressum</h1>

        <div className="space-y-8 text-foreground-secondary leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Anbieterin</h2>
            <p>
              Versica AG<br />
              Bahnhofstrasse 1<br />
              8001 Zürich<br />
              Schweiz
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Kontakt</h2>
            <p>
              E-Mail: <a href="mailto:hallo@versica.ch" className="text-primary hover:underline">hallo@versica.ch</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Handelsregister</h2>
            <p>Eingetragen im Handelsregister des Kantons Zürich<br />UID: CHE-XXX.XXX.XXX</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Aufsicht</h2>
            <p>Eidgenössische Finanzmarktaufsicht FINMA, Laupenstrasse 27, 3003 Bern. Versica AG ist als ungebundener Versicherungsvermittler im FINMA-Register eingetragen.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Haftungsausschluss</h2>
            <p>Versica stellt Informationen zur Schweizer Krankenversicherung mit grösster Sorgfalt bereit. Die Inhalte sind jedoch unverbindlich und ersetzen keine individuelle Rechts- oder Steuerberatung. Für die Richtigkeit der von dir hochgeladenen Police-Dokumente bist du selbst verantwortlich.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Urheberrecht</h2>
            <p>Sämtliche Inhalte dieser Website sind urheberrechtlich geschützt. Eine Vervielfältigung, Bearbeitung oder Verbreitung bedarf der vorherigen schriftlichen Zustimmung von Versica AG.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
