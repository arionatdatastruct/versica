import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

const cols = [
  {
    title: "Produkt",
    links: [
      { label: "Police hochladen", to: "/app/police-upload" as const },
      { label: "Beratung", to: "/beratung" as const },
      { label: "Vergleich", to: "/vergleich" as const },
      { label: "Preise", to: "/preise" as const },
    ],
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Über uns", to: "/ueber-uns" as const },
      { label: "Kontakt", to: "/kontakt" as const },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Datenschutz", to: "/datenschutz" as const },
      { label: "Impressum", to: "/impressum" as const },
    ],
  },
];

export const Footer = () => (
  <footer className="bg-surface-beige mt-24">
    <div className="container mx-auto py-16 px-4">
      <div className="grid md:grid-cols-5 gap-12 mb-12">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <span className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center">
              <Check className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </span>
            <span className="text-xl font-bold tracking-tight text-primary">Versica</span>
          </Link>
          <p className="text-foreground-secondary max-w-xs">
            Schweizer KI-Beratung für deine Krankenversicherung.
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="font-semibold mb-4 text-foreground">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-foreground-secondary hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between gap-4">
        <p className="text-xs text-foreground-tertiary">
          © 2026 Versica AG · FINMA-registrierter Versicherungsvermittler
        </p>
        <div className="flex gap-4 text-xs text-foreground-tertiary">
          <span>Schweizer Hosting</span>·<span>revDSG-konform</span>·<span>AES-256 verschlüsselt</span>
        </div>
      </div>
    </div>
  </footer>
);
