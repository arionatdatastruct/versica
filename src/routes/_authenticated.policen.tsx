import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Upload,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
  Clock,
  Copy as CopyIcon,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { deletePolicy } from "@/lib/policy-actions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/policen")({
  component: PolicenPage,
});

type PolicyRow = {
  id: string;
  insurer: string | null;
  policy_number: string | null;
  insured_first_name: string | null;
  insured_last_name: string | null;
  total_monthly_premium: number | null;
  monthly_premium: number | null;
  kvg_monthly_premium: number | null;
  valid_from: string | null;
  ocr_status: string;
  ocr_error: string | null;
  confirmed_at: string | null;
  member_id: string | null;
  file_path: string | null;
  created_at: string;
};

type Filter = "all" | "unconfirmed" | "failed" | "duplicates";

function PolicenPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("policies")
      .select(
        "id, insurer, policy_number, insured_first_name, insured_last_name, total_monthly_premium, monthly_premium, kvg_monthly_premium, valid_from, ocr_status, ocr_error, confirmed_at, member_id, file_path, created_at",
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Konnte Policen nicht laden: " + error.message);
    } else {
      setPolicies(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const duplicateIds = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of policies) {
      const key = [
        (p.insurer ?? "").toLowerCase().trim(),
        (p.insured_first_name ?? "").toLowerCase().trim(),
        (p.insured_last_name ?? "").toLowerCase().trim(),
        p.valid_from ?? "",
        p.policy_number ?? "",
      ]
        .filter(Boolean)
        .join("|");
      if (!key || key.length < 3) continue;
      const arr = map.get(key) ?? [];
      arr.push(p.id);
      map.set(key, arr);
    }
    const dupes = new Set<string>();
    for (const ids of map.values()) {
      if (ids.length > 1) ids.forEach((id) => dupes.add(id));
    }
    return dupes;
  }, [policies]);

  const visible = useMemo(() => {
    switch (filter) {
      case "unconfirmed":
        return policies.filter((p) => !p.confirmed_at);
      case "failed":
        return policies.filter((p) => p.ocr_status === "failed");
      case "duplicates":
        return policies.filter((p) => duplicateIds.has(p.id));
      default:
        return policies;
    }
  }, [policies, filter, duplicateIds]);

  const counts = {
    all: policies.length,
    unconfirmed: policies.filter((p) => !p.confirmed_at).length,
    failed: policies.filter((p) => p.ocr_status === "failed").length,
    duplicates: duplicateIds.size,
  };

  const handleDelete = async (p: PolicyRow) => {
    setDeleting(p.id);
    try {
      await deletePolicy(p.id, p.file_path);
      setPolicies((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Police gelöscht");
    } catch (e: any) {
      toast.error("Löschen fehlgeschlagen: " + (e?.message ?? e));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-12 px-4 space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="eyebrow mb-2">Verwaltung</div>
            <h1 className="text-3xl lg:text-4xl font-semibold mb-2">Meine Policen</h1>
            <p className="text-foreground-secondary text-sm max-w-xl">
              Alle hochgeladenen Policen — auch Entwürfe, fehlgeschlagene Analysen und Duplikate.
            </p>
          </div>
          <Button
            asChild
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-6"
          >
            <Link to="/police-upload">
              <Upload className="mr-2 h-4 w-4" /> Police hochladen
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} count={counts.all}>
            Alle
          </FilterChip>
          <FilterChip
            active={filter === "unconfirmed"}
            onClick={() => setFilter("unconfirmed")}
            count={counts.unconfirmed}
          >
            Unbestätigt
          </FilterChip>
          <FilterChip
            active={filter === "failed"}
            onClick={() => setFilter("failed")}
            count={counts.failed}
          >
            Fehlgeschlagen
          </FilterChip>
          <FilterChip
            active={filter === "duplicates"}
            onClick={() => setFilter("duplicates")}
            count={counts.duplicates}
          >
            Duplikate
          </FilterChip>
        </div>

        {visible.length === 0 ? (
          <div className="card-soft p-10 text-center text-foreground-secondary">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            Keine Policen in dieser Ansicht.
          </div>
        ) : (
          <div className="card-soft divide-y divide-border overflow-hidden">
            {visible.map((p) => {
              const premium =
                p.total_monthly_premium ?? p.monthly_premium ?? p.kvg_monthly_premium;
              const insured = [p.insured_first_name, p.insured_last_name]
                .filter(Boolean)
                .join(" ");
              const isDuplicate = duplicateIds.has(p.id);
              return (
                <div
                  key={p.id}
                  className="p-5 grid md:grid-cols-[1fr_auto_auto] gap-4 items-center"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">
                        {p.insurer ?? "Unbekannter Versicherer"}
                      </p>
                      <StatusBadge status={p.ocr_status} confirmed={!!p.confirmed_at} />
                      {isDuplicate && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning/15 text-warning text-xs font-medium">
                          <CopyIcon className="w-3 h-3" /> Duplikat
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-foreground-secondary truncate">
                      {insured || "—"}
                      {p.policy_number ? ` · Nr. ${p.policy_number}` : ""}
                      {p.valid_from ? ` · gültig ab ${formatDate(p.valid_from)}` : ""}
                    </div>
                    {p.ocr_status === "failed" && p.ocr_error && (
                      <div className="text-xs text-destructive truncate" title={p.ocr_error}>
                        {p.ocr_error}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {premium != null ? `CHF ${premium.toFixed(2)}` : "—"}
                    </p>
                    <p className="text-xs text-foreground-secondary">pro Monat</p>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      <Link
                        to="/police-bestaetigen/$policyId"
                        params={{ policyId: p.id }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        {p.confirmed_at ? "Öffnen" : "Bestätigen"}
                      </Link>
                    </Button>
                    <DeleteButton
                      label={p.insurer ?? "diese Police"}
                      disabled={deleting === p.id}
                      onConfirm={() => handleDelete(p)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-surface border border-border text-foreground hover:bg-primary-light"
      }`}
    >
      {children}
      <span className="ml-1.5 opacity-70">({count})</span>
    </button>
  );
}

function StatusBadge({ status, confirmed }: { status: string; confirmed: boolean }) {
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
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-light text-accent text-xs font-medium">
        Entwurf
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
      {status}
    </span>
  );
}

export function DeleteButton({
  label,
  onConfirm,
  disabled,
}: {
  label: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
          disabled={disabled}
        >
          {disabled ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Police löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            {label} wird unwiderruflich gelöscht — inklusive der hochgeladenen Datei.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
