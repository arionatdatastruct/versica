import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VersicaIcon } from "@/components/VersicaIcon";
import { SpeechBubble } from "@/components/SpeechBubble";
import { Button } from "@/components/ui/button";
import { Check, Eye, Loader2, Lock, MessageCircle, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/app/police-upload")({ component: PoliceUpload });

const steps = [
  { icon: Lock, title: "Sicher hochladen", text: "Deine Datei wird verschlüsselt übertragen und in der Schweiz/EU gespeichert." },
  { icon: Eye, title: "Versica liest aus", text: "Versica erkennt Versicherer, Modell, Franchise und Leistungen – meist unter 30 Sekunden." },
  { icon: Check, title: "Du prüfst alles", text: "Bevor wir weitermachen, kontrollierst du, ob alles richtig erkannt wurde." },
  { icon: MessageCircle, title: "Wir starten das Gespräch", text: "Ab jetzt kannst du jede Frage zu deiner Police stellen." },
];
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif"];

function PoliceUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!user) return toast.error("Bitte einloggen.");
    if (!ALLOWED_MIME.includes(file.type)) return toast.error("Nur PDF, JPG, PNG oder HEIC.");
    if (file.size > MAX_BYTES) return toast.error("Maximal 10 MB.");

    setUploading(true);
    setStatusMsg("Lade Police hoch …");

    try {
      const { data: inserted, error: insErr } = await supabase.from("policies")
        .insert({ owner_id: user.id, ocr_status: "manual", file_mime: file.type })
        .select("id").single();
      if (insErr || !inserted) throw insErr ?? new Error("Insert failed");
      const policyId = inserted.id;

      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/${policyId}/${safeName}`;
      const { error: upErr } = await supabase.storage.from("policy-uploads")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: updErr } = await supabase.from("policies")
        .update({ file_path: path, ocr_status: "pending" }).eq("id", policyId);
      if (updErr) throw updErr;

      // OCR via Klippa starten — Sicherheitsnetz: nach 90s trotzdem weiter
      setStatusMsg("Versica liest deine Police … das kann bis zu einer Minute dauern.");
      const ocrPromise = supabase.functions.invoke("process-policy", { body: { policyId } });
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 90_000));
      try {
        await Promise.race([ocrPromise, timeout]);
      } catch (ocrErr) {
        console.error("OCR fehlgeschlagen", ocrErr);
      }

      navigate({ to: "/police-bestaetigen/$policyId", params: { policyId } });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Upload fehlgeschlagen");
      setUploading(false);
      setStatusMsg(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl py-12 lg:py-16 px-4">
        <div className="flex items-start gap-4 mb-10">
          <VersicaIcon size="lg" />
          <div className="bg-primary-light rounded-3xl rounded-tl-md px-5 py-4 shadow-sm flex-1">
            <p className="leading-relaxed">
              Hoi! Schön, dass du da bist. Lade deine aktuelle Police hoch – Versica liest sie für dich aus und beantwortet jede Frage zu deinen Leistungen.
            </p>
          </div>
        </div>

        <p className="text-sm font-medium text-primary mb-3">Schritt 1 von 3 · Police hochladen</p>
        <h1 className="text-4xl lg:text-5xl font-semibold mb-3">Deine Police, kennengelernt in 30 Sekunden.</h1>
        <p className="text-foreground-secondary text-lg mb-10 leading-relaxed">
          Keine Sorge wegen deiner Daten – wir erklären dir genau, was passiert.
        </p>

        {uploading ? (
          <div className="border-2 border-dashed border-primary rounded-3xl bg-primary-light/40 p-12 text-center">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-lg font-semibold mb-1">{statusMsg}</p>
            <p className="text-sm text-foreground-secondary">Bitte diese Seite offen lassen.</p>
          </div>
        ) : (
          <label className="block cursor-pointer group">
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="border-2 border-dashed border-primary rounded-3xl bg-primary-light/40 hover:bg-primary-light hover:shadow-md transition-all p-12 text-center">
              <div className="w-20 h-20 rounded-3xl bg-surface flex items-center justify-center mx-auto mb-5 shadow-sm">
                <UploadCloud className="w-10 h-10 text-primary" strokeWidth={2} />
              </div>
              <p className="text-xl font-semibold mb-2">Datei hier ablegen oder klicken</p>
              <p className="text-foreground-secondary mb-3">PDF, JPG, PNG oder HEIC · max. 10 MB</p>
              <p className="text-sm text-foreground-tertiary">Versicherungsausweis, Police, Jahresübersicht</p>
            </div>
          </label>
        )}

        <div className="mt-14">
          <div className="mb-8">
            <div className="eyebrow mb-2">Transparenz</div>
            <h2 className="text-3xl font-semibold">Was genau passiert mit deiner Datei</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {steps.map((s) => (
              <div key={s.title} className="card-soft p-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-primary" strokeWidth={2} />
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-foreground-secondary leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-beige rounded-3xl p-8 mt-12">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center shadow-sm flex-shrink-0">
              <Lock className="w-7 h-7 text-primary" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-3">Was passiert mit deinen Daten?</h3>
              <ul className="space-y-2.5">
                {[
                  "Speicherung in der Schweiz/EU, AES-256 verschlüsselt",
                  "Keine Weitergabe an Versicherer oder Dritte",
                  "Du kannst alles jederzeit mit einem Klick löschen",
                  "DSGVO/revDSG-konform · jährlich extern auditiert",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-foreground-secondary">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="eyebrow mb-2">So sieht's danach aus</div>
          <h2 className="text-3xl font-semibold mb-6">Ein Vorgeschmack</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="card-soft p-6">
              <p className="text-xs text-foreground-tertiary mb-3 uppercase tracking-wider">Deine Police, ausgelesen</p>
              <div className="space-y-2.5 text-sm">
                {[["Versicherer", "CSS"], ["Modell", "Hausarzt"], ["Franchise", "CHF 2'500"], ["Prämie", "CHF 412.50"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border pb-2">
                    <span className="text-foreground-secondary">{k}</span>
                    <span className="font-semibold text-primary-dark">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-soft p-5 space-y-3">
              <SpeechBubble variant="user" showAvatar={false}><p className="text-sm">Sind Brillen gedeckt?</p></SpeechBubble>
              <SpeechBubble><p className="text-sm leading-relaxed">CHF 180 alle 3 Jahre, nur medizinisch nötig. Quelle: S. 4 deiner Police.</p></SpeechBubble>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-foreground-secondary">
            Noch keine Police zur Hand?{" "}
            <Button asChild variant="link" className="text-primary px-1 h-auto">
              <Link to="/beratung">→ Trotzdem starten</Link>
            </Button>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
