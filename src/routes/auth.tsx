import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: String(fd.get("display_name")) },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Willkommen bei Versica!");
    navigate({ to: "/dashboard" });
  };

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-md py-16 px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-semibold mb-2">Willkommen bei Versica</h1>
          <p className="text-foreground-secondary">Melde dich an oder erstelle ein Konto.</p>
        </div>

        <div className="card-soft p-7">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 mb-6 rounded-full bg-primary-light p-1 h-auto">
              <TabsTrigger value="signin" className="rounded-full data-[state=active]:bg-surface">Anmelden</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-surface">Registrieren</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="si-email">E-Mail</Label>
                  <Input id="si-email" name="email" type="email" required className="rounded-2xl mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="si-password">Passwort</Label>
                  <Input id="si-password" name="password" type="password" required className="rounded-2xl mt-1.5" />
                </div>
                <Button type="submit" disabled={loading} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 h-12">
                  {loading ? "Einen Moment …" : "Anmelden"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="su-name">Wie sollen wir dich nennen?</Label>
                  <Input id="su-name" name="display_name" required className="rounded-2xl mt-1.5" placeholder="Sandra" />
                </div>
                <div>
                  <Label htmlFor="su-email">E-Mail</Label>
                  <Input id="su-email" name="email" type="email" required className="rounded-2xl mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="su-password">Passwort</Label>
                  <Input id="su-password" name="password" type="password" required minLength={8} className="rounded-2xl mt-1.5" />
                  <p className="text-xs text-foreground-tertiary mt-1.5">Mindestens 8 Zeichen.</p>
                </div>
                <Button type="submit" disabled={loading} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 h-12">
                  {loading ? "Einen Moment …" : "Konto erstellen"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-sm text-foreground-tertiary mt-6">
          Mit der Registrierung akzeptierst du unsere{" "}
          <Link to="/" className="underline">Nutzungsbedingungen</Link>.
        </p>
      </main>
      <Footer />
    </div>
  );
}

