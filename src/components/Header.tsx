import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Check, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const platformNav = [
  { label: "Dashboard", to: "/app/dashboard" },
  { label: "Policen", to: "/app/policen" },
  { label: "Familie", to: "/app/familie" },
  { label: "Empfehlungen", to: "/app/empfehlungen" },
] as const;

const marketingNav = [
  { label: "Beratung", to: "/beratung" },
  { label: "Vergleich", to: "/vergleich" },
  { label: "Preise", to: "/preise" },
  { label: "Über uns", to: "/ueber-uns" },
] as const;

const langs = ["DE", "FR", "IT", "EN"];

export const Header = () => {
  const [lang, setLang] = useState("DE");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const initials =
    (user?.user_metadata?.display_name as string | undefined)?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "?";

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-border/60">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center">
            <Check className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-bold tracking-tight text-primary">Versica</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems
            .filter((item) => !item.authOnly || !!user)
            .map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  path === item.to ? "text-primary" : "text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground-secondary hover:text-primary px-3 py-2 rounded-full"
            >
              <Globe className="w-4 h-4" strokeWidth={2} />
              {lang}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 bg-surface rounded-2xl shadow-lg border border-border p-2 min-w-[80px] z-50">
                {langs.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setOpen(false);
                    }}
                    className="block w-full text-left px-3 py-1.5 rounded-xl text-sm hover:bg-primary-light"
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
          {user ? (
            <>
              <Link
                to="/app/dashboard"
                className="hidden sm:flex w-10 h-10 rounded-full bg-primary text-primary-foreground items-center justify-center font-semibold text-sm"
                title={user.email ?? ""}
              >
                {initials}
              </Link>
              <Button
                variant="ghost"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="rounded-full text-foreground hover:text-primary hover:bg-primary-light"
                title="Abmelden"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden sm:inline-flex rounded-full text-foreground hover:text-primary hover:bg-primary-light"
              >
                <Link to="/auth">Anmelden</Link>
              </Button>
              <Button asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-5 shadow-sm">
                <Link to="/auth">Kostenlos starten</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
