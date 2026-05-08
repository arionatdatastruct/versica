import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SWISS_CANTONS } from "@/lib/family";

export type MemberRecord = {
  id: string;
  first_name: string;
  last_name: string | null;
  birth_date: string | null;
  gender: "female" | "male" | "other" | null;
  postal_code: string | null;
  canton: string | null;
  notes: string | null;
  is_self: boolean;
};

const schema = z.object({
  first_name: z.string().trim().min(1, "Vorname erforderlich").max(60),
  last_name: z.string().trim().max(60).optional().or(z.literal("")),
  birth_date: z.string().min(1, "Geburtsdatum erforderlich"),
  gender: z.enum(["female", "male", "other"]),
  postal_code: z.string().trim().regex(/^\d{4}$/, "4-stellige PLZ").optional().or(z.literal("")),
  canton: z.string().trim().length(2).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  is_self: z.boolean(),
});

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  householdId: string;
  member?: MemberRecord | null;
  hasSelfAlready: boolean;
  onSaved: (m: MemberRecord) => void;
};

export function MemberFormDialog({ open, onOpenChange, householdId, member, hasSelfAlready, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "other" | "">("");
  const [plz, setPlz] = useState("");
  const [canton, setCanton] = useState("");
  const [notes, setNotes] = useState("");
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFirst(member?.first_name ?? "");
    setLast(member?.last_name ?? "");
    setBirth(member?.birth_date ?? "");
    setGender(member?.gender ?? "");
    setPlz(member?.postal_code ?? "");
    setCanton(member?.canton ?? "");
    setNotes(member?.notes ?? "");
    setIsSelf(member?.is_self ?? false);
  }, [open, member]);

  const canToggleSelf = !hasSelfAlready || member?.is_self === true;

  const submit = async () => {
    const parsed = schema.safeParse({
      first_name: first, last_name: last, birth_date: birth, gender,
      postal_code: plz, canton, notes, is_self: isSelf,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Bitte Eingaben prüfen.");
      return;
    }
    const payload = {
      household_id: householdId,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name || null,
      birth_date: parsed.data.birth_date,
      gender: parsed.data.gender,
      postal_code: parsed.data.postal_code || null,
      canton: parsed.data.canton || null,
      notes: parsed.data.notes || null,
      is_self: parsed.data.is_self,
    };
    setSaving(true);
    const tbl = supabase.from("household_members") as any;
    const q = member
      ? tbl.update(payload).eq("id", member.id).select("*").single()
      : tbl.insert(payload).select("*").single();
    const { data, error } = await q;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(member ? "Mitglied aktualisiert." : "Mitglied hinzugefügt.");
    onSaved(data as unknown as MemberRecord);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? "Mitglied bearbeiten" : "Mitglied hinzufügen"}</DialogTitle>
          <DialogDescription>Diese Angaben helfen Versica, passende Prämien und Empfehlungen zu berechnen.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Vorname *</Label>
              <Input value={first} onChange={(e) => setFirst(e.target.value)} maxLength={60} />
            </div>
            <div>
              <Label className="text-sm">Nachname</Label>
              <Input value={last} onChange={(e) => setLast(e.target.value)} maxLength={60} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Geburtsdatum *</Label>
              <Input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} max={new Date().toISOString().slice(0,10)} />
            </div>
            <div>
              <Label className="text-sm">Geschlecht *</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                <SelectTrigger><SelectValue placeholder="wählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Weiblich</SelectItem>
                  <SelectItem value="male">Männlich</SelectItem>
                  <SelectItem value="other">Divers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">PLZ</Label>
              <Input value={plz} onChange={(e) => setPlz(e.target.value)} maxLength={4} placeholder="8001" />
            </div>
            <div>
              <Label className="text-sm">Kanton</Label>
              <Select value={canton} onValueChange={setCanton}>
                <SelectTrigger><SelectValue placeholder="wählen" /></SelectTrigger>
                <SelectContent>
                  {SWISS_CANTONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm">Notizen</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} placeholder="z. B. trägt Brille, Zahnspange geplant" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border p-3">
            <div>
              <Label className="text-sm">Das bin ich</Label>
              <p className="text-xs text-foreground-secondary">
                {canToggleSelf ? "Markiere dich selbst als Mitglied." : "Bereits einer anderen Person zugewiesen."}
              </p>
            </div>
            <Switch checked={isSelf} onCheckedChange={setIsSelf} disabled={!canToggleSelf} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Abbrechen</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
