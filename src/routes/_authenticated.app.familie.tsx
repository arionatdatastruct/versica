import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MemberFormDialog, type MemberRecord } from "@/components/family/MemberFormDialog";
import { calculateAge, deriveRole, ROLE_LABEL, GENDER_LABEL } from "@/lib/family";

export const Route = createFileRoute("/_authenticated/app/app/familie")({ component: FamiliePage });

function FamiliePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [policyCounts, setPolicyCounts] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MemberRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MemberRecord | null>(null);

  const load = async () => {
    if (!user) return;
    const { data: hh } = await supabase.from("households").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
    if (!hh) { setLoading(false); return; }
    setHouseholdId(hh.id);
    const [{ data: ms }, { data: ps }] = await Promise.all([
      supabase.from("household_members").select("*").eq("household_id", hh.id).order("is_self", { ascending: false }).order("created_at"),
      supabase.from("policies").select("member_id").eq("owner_id", user.id),
    ]);
    setMembers((ms ?? []) as MemberRecord[]);
    const counts: Record<string, number> = {};
    for (const p of ps ?? []) if (p.member_id) counts[p.member_id] = (counts[p.member_id] ?? 0) + 1;
    setPolicyCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const hasSelf = members.some((m) => m.is_self);

  const onAdd = () => { setEditing(null); setDialogOpen(true); };
  const onEdit = (m: MemberRecord) => { setEditing(m); setDialogOpen(true); };
  const onSaved = () => { void load(); };

  const doDelete = async (m: MemberRecord) => {
    const count = policyCounts[m.id] ?? 0;
    if (count > 0) { toast.error(`${m.first_name} hat noch ${count} Police(n). Bitte zuerst entfernen oder umhängen.`); return; }
    const { error } = await supabase.from("household_members").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Mitglied gelöscht.");
    setConfirmDelete(null);
    void load();
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="eyebrow mb-2">Haushalt</div>
            <h1 className="text-3xl lg:text-4xl font-semibold">Familienmitglieder</h1>
            <p className="text-foreground-secondary mt-2 max-w-xl">Pflege hier alle Personen, für die Versica Policen analysieren soll.</p>
          </div>
          <Button onClick={onAdd} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" /> Mitglied hinzufügen
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="card-soft p-10 text-center">
            <UserCircle className="w-12 h-12 mx-auto text-foreground-secondary mb-3" />
            <p className="text-foreground-secondary mb-4">Noch keine Mitglieder.</p>
            <Button onClick={onAdd}><Plus className="w-4 h-4 mr-2" /> Erstes Mitglied hinzufügen</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const age = calculateAge(m.birth_date);
              const role = deriveRole(age);
              const initials = (m.first_name[0] + (m.last_name?.[0] ?? "")).toUpperCase();
              const polCount = policyCounts[m.id] ?? 0;
              return (
                <div key={m.id} className="card-soft p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-semibold flex-shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{m.first_name}{m.last_name ? ` ${m.last_name}` : ""}</p>
                      {m.is_self && <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Du</span>}
                      {role && <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{ROLE_LABEL[role]}</span>}
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      {age != null ? `${age} J.` : "—"}
                      {m.gender ? ` · ${GENDER_LABEL[m.gender as keyof typeof GENDER_LABEL] ?? m.gender}` : ""}
                      {m.canton ? ` · ${m.canton}${m.postal_code ? ` ${m.postal_code}` : ""}` : ""}
                      {` · ${polCount} Police${polCount === 1 ? "" : "n"}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(m)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(m)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <Button asChild variant="ghost"><Link to="/dashboard">← Zurück zum Dashboard</Link></Button>
        </div>
      </main>
      <Footer />

      {householdId && (
        <MemberFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          householdId={householdId}
          member={editing}
          hasSelfAlready={hasSelf}
          onSaved={onSaved}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDelete?.first_name} löschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && doDelete(confirmDelete)}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
