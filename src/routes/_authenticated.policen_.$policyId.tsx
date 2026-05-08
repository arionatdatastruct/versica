import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  Loader2,
  FileWarning,
  Check,
  AlertTriangle,
  Clock,
  Copy as CopyIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { deletePolicy } from "@/lib/policy-actions";
import { DeleteButton } from "./_authenticated.policen";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/policen_/$policyId")({
  component: PolicyDetailPage,
});

type Policy = {
  id: string;
  insurer: string | null;
  policy_type: string | null;
  policy_number: string | null;
  insured_first_name: string | null;
  insured_last_name: string | null;
  valid_from: string | null;
  valid_to: string | null;
  kvg_model: string | null;
  kvg_franchise: number | null;
  kvg_accident_coverage: boolean | null;
  kvg_monthly_premium: number | null;
  vvg_products: Array<{ name: string; monthly_premium: number | null }> | null;
  vvg_total_monthly_premium: number | null;
  total_monthly_premium: number | null;
  monthly_premium: number | null;
  model: string | null;
  franchise: number | null;
  ocr_status: string;
  ocr_error: string | null;
  confirmed_at: string | null;
  file_path: string | null;
  file_mime: string | null;
};

function PolicyDetailPage() {
  const { policyId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("id", policyId)
        .eq("owner_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("Konnte Police nicht laden: " + error.message);
        setLoading(false);
        return;
      }
      setPolicy(data as Policy | null);

      if (data?.file_path) {
        const { data: urlData, error: urlErr } = await supabase.storage
          .from("policy-uploads")
          .createSignedUrl(data.file_path, 3600);
        if (cancelled) return;
        if (urlErr) {
          setPreviewError("Vorschau-URL konnte nicht erstellt werden.");
        } else {
          setSignedUrl(urlData?.signedUrl ?? null);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [policyId, user]);

  const handleDelete = async () => {
    if (!policy) return;
    try {
      await deletePolicy(policy.id, policy.file_path);
      toast.success("Police gelöscht");
      navigate({ to: "/policen" });
    } catch (e: any) {
      toast.error("Löschen fehlgeschlagen: " + (e?.message ?? e));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!policy) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-2xl py-16 text-center">
          <p className="mb-6">Police nicht gefunden.</p>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/policen">
              <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zur Übersicht
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const insured = [policy.insured_first_name, policy.insured_last_name]
    .filter(Boolean)
    .join(" ");
  const total =
    policy.total_monthly_premium ??
    policy.monthly_premium ??
    policy.kvg_monthly_premium;
  const isPdf =
    (policy.file_mime ?? "").includes("pdf") ||
    (policy.file_path ?? "").toLowerCase().endsWith(".pdf");
  const isImage = (policy.file_mime ?? "").startsWith("image/");
  const isHeic =
    (policy.file_mime ?? "").includes("heic") ||
    (policy.file_mime ?? "").includes("heif");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full -ml-2"
          >
            <Link to="/policen">
              <ArrowLeft className="w-4 h-4 mr-2" /> Alle Policen
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {signedUrl && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <a href={signedUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> PDF öffnen
                </a>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link
                to="/police-bestaetigen/$policyId"
                params={{ policyId: policy.id }}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Bearbeiten
              </Link>
            </Button>
            <DeleteButton
              label={policy.insurer ?? "diese Police"}
              onConfirm={handleDelete}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
          {/* PDF / Bild-Vorschau */}
          <div className="card-soft overflow-hidden lg:sticky lg:top-6 h-[60vh] lg:h-[calc(100vh-8rem)]">
            {!policy.file_path ? (
              <EmptyPreview text="Keine Originaldatei hinterlegt." />
            ) : previewError ? (
              <EmptyPreview text={previewError} />
            ) : !signedUrl ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : isHeic ? (
              <EmptyPreview text={'HEIC-Vorschau wird vom Browser nicht unterstützt — über „PDF öffnen" herunterladen.'} />
            ) : isPdf ? (
              <iframe
                src={signedUrl}
                title="Police-Vorschau"
                className="w-full h-full border-0"
              />
            ) : isImage ? (
              <div className="h-full overflow-auto bg-muted/40 flex items-center justify-center p-2">
                <img
                  src={signedUrl}
                  alt="Police-Vorschau"
                  className="max-w-full h-auto rounded-md shadow-sm"
                />
              </div>
            ) : (
              <EmptyPreview text="Dateiformat kann nicht eingebettet werden." />
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div className="card-soft p-6">
              <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold truncate">
                    {policy.insurer ?? "Unbekannter Versicherer"}
                  </h1>
                  <p className="text-sm text-foreground-secondary mt-0.5">
                    {insured || "—"}
                    {policy.policy_number ? ` · Nr. ${policy.policy_number}` : ""}
                  </p>
                </div>
                <StatusBadge
                  status={policy.ocr_status}
                  confirmed={!!policy.confirmed_at}
                />
              </div>

              {total != null && (
                <div className="rounded-2xl bg-primary-light/40 px-5 py-4 flex items-baseline justify-between">
                  <span className="text-sm text-foreground-secondary">
                    Gesamtprämie pro Monat
                  </span>
                  <span className="text-2xl font-semibold text-primary-dark">
                    CHF {total.toFixed(2)}
                  </span>
                </div>
              )}

              {policy.ocr_status === "failed" && policy.ocr_error && (
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                  <strong>Auslesen fehlgeschlagen:</strong> {policy.ocr_error}
                </div>
              )}
            </div>

            <DetailSection title="Police-Info">
              <Row label="Art" value={prettyPolicyType(policy.policy_type)} />
              <Row label="Versicherer" value={policy.insurer} />
              <Row label="Policennummer" value={policy.policy_number} />
              <Row label="Gültig ab" value={formatDate(policy.valid_from)} />
              <Row label="Gültig bis" value={formatDate(policy.valid_to)} />
            </DetailSection>

            {(policy.kvg_model ||
              policy.kvg_franchise != null ||
              policy.kvg_monthly_premium != null ||
              policy.kvg_accident_coverage != null) && (
              <DetailSection title="Grundversicherung (KVG)">
                <Row
                  label="Modell"
                  value={policy.kvg_model ?? policy.model}
                />
                <Row
                  label="Franchise"
                  value={
                    (policy.kvg_franchise ?? policy.franchise) != null
                      ? `CHF ${(policy.kvg_franchise ?? policy.franchise)?.toLocaleString("de-CH")}`
                      : null
                  }
                />
                <Row
                  label="Unfalldeckung"
                  value={
                    policy.kvg_accident_coverage == null
                      ? null
                      : policy.kvg_accident_coverage
                        ? "eingeschlossen"
                        : "ausgeschlossen"
                  }
                />
                <Row
                  label="Prämie/Monat"
                  value={
                    policy.kvg_monthly_premium != null
                      ? `CHF ${policy.kvg_monthly_premium.toFixed(2)}`
                      : policy.monthly_premium != null
                        ? `CHF ${policy.monthly_premium.toFixed(2)}`
                        : null
                  }
                />
              </DetailSection>
            )}

            {Array.isArray(policy.vvg_products) &&
              policy.vvg_products.length > 0 && (
                <DetailSection title="Zusatzversicherungen (VVG)">
                  {policy.vvg_products.map((p, i) => (
                    <Row
                      key={i}
                      label={p.name}
                      value={
                        p.monthly_premium != null
                          ? `CHF ${Number(p.monthly_premium).toFixed(2)}`
                          : "—"
                      }
                    />
                  ))}
                  {policy.vvg_total_monthly_premium != null && (
                    <Row
                      label="Total VVG/Monat"
                      value={`CHF ${policy.vvg_total_monthly_premium.toFixed(2)}`}
                      strong
                    />
                  )}
                </DetailSection>
              )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function EmptyPreview({ text }: { text: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-foreground-secondary">
      <FileWarning className="w-10 h-10 mb-3 opacity-50" />
      <p className="text-sm max-w-xs">{text}</p>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-soft p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-secondary mb-4">
        {title}
      </h2>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string | number | null | undefined;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-foreground-secondary">{label}</span>
      <span className={strong ? "font-semibold" : "font-medium"}>
        {value == null || value === "" ? "—" : value}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
  confirmed,
}: {
  status: string;
  confirmed: boolean;
}) {
  if (confirmed) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/15 text-success text-xs font-medium">
        <Check className="w-3 h-3" strokeWidth={3} /> Bestätigt
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-xs font-medium">
        <AlertTriangle className="w-3 h-3" /> Fehlgeschlagen
      </span>
    );
  }
  if (status === "processing" || status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-light text-primary-dark text-xs font-medium">
        <Clock className="w-3 h-3" /> In Bearbeitung
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-light text-accent text-xs font-medium">
      <CopyIcon className="w-3 h-3" /> Entwurf
    </span>
  );
}

function prettyPolicyType(t: string | null) {
  switch (t) {
    case "grundversicherung":
      return "Grundversicherung (KVG)";
    case "zusatzversicherung":
      return "Zusatzversicherung (VVG)";
    case "kombiniert":
      return "Grund + Zusatz kombiniert";
    default:
      return t;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
