import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — Versica" },
      { name: "description", content: "Frag uns alles rund um Versica und Schweizer Krankenversicherung. Wir antworten innert 24 Stunden." },
      { property: "og:title", content: "Kontakt — Versica" },
      { property: "og:description", content: "Wir antworten innert 24 Stunden." },
    ],
  }),
  component: KontaktPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Bitte Namen angeben").max(100),
  email: z.string().trim().email("Ungültige E-Mail").max(255),
  message: z.string().trim().min(10, "Bitte mindestens 10 Zeichen").max(2000),
});

function KontaktPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Bitte Eingaben prüfen");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Danke! Wir melden uns innert 24 Stunden.");
      setForm({ name: "", email: "", message: "" });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20 lg:py-24 max-w-5xl">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="eyebrow mb-3">Kontakt</div>
          <h1 className="text-4xl lg:text-5xl font-semibold mb-4">Schreib uns. Wir antworten persönlich.</h1>
          <p className="text-foreground-secondary text-lg">
            Egal ob Frage zur Versicherung, Feedback oder Pressanfrage — wir freuen uns.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          <form onSubmit={submit} className="md:col-span-3 card-soft p-8 space-y-5">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Maria Müller" maxLength={100} />
            </div>
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="maria@example.ch" maxLength={255} />
            </div>
            <div>
              <Label htmlFor="message">Nachricht</Label>
              <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Wie können wir helfen?" rows={6} maxLength={2000} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 h-12">
              {submitting ? "Wird gesendet…" : "Nachricht senden"}
            </Button>
          </form>

          <aside className="md:col-span-2 space-y-4">
            <div className="card-soft p-6">
              <Mail className="w-6 h-6 text-primary mb-3" strokeWidth={2} />
              <p className="font-semibold mb-1">E-Mail</p>
              <a href="mailto:hallo@versica.ch" className="text-foreground-secondary hover:text-primary text-sm">hallo@versica.ch</a>
            </div>
            <div className="card-soft p-6">
              <MapPin className="w-6 h-6 text-primary mb-3" strokeWidth={2} />
              <p className="font-semibold mb-1">Adresse</p>
              <p className="text-foreground-secondary text-sm">Versica AG<br />8001 Zürich, Schweiz</p>
            </div>
            <div className="card-soft p-6">
              <Clock className="w-6 h-6 text-primary mb-3" strokeWidth={2} />
              <p className="font-semibold mb-1">Antwortzeit</p>
              <p className="text-foreground-secondary text-sm">Mo–Fr innert 24 Stunden</p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
