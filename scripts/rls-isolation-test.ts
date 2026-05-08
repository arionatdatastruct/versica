// RLS isolation smoke-test: zwei Test-User, jeder sieht nur seine Daten.
// Run: bun run scripts/rls-isolation-test.ts
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL!;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY!;
if (!URL || !ANON) { console.error("Missing SUPABASE_URL/KEY"); process.exit(1); }

const stamp = Date.now();
const userA = { email: `rls-a-${stamp}@example.com`, password: "TestPass!12345", first: "Anna", last: "A" };
const userB = { email: `rls-b-${stamp}@example.com`, password: "TestPass!12345", first: "Bert", last: "B" };

function client() { return createClient(URL, ANON, { auth: { persistSession: false } }); }

async function signupAndLogin(u: typeof userA) {
  const c = client();
  const { error: se } = await c.auth.signUp({
    email: u.email, password: u.password,
    options: { data: { first_name: u.first, last_name: u.last, display_name: `${u.first} ${u.last}` } },
  });
  if (se) throw new Error(`signup ${u.email}: ${se.message}`);
  // bei deaktiviertem confirm-email ist signUp bereits eingeloggt; sonst explizit anmelden
  const { data: sess } = await c.auth.getSession();
  if (!sess.session) {
    const { error: le } = await c.auth.signInWithPassword({ email: u.email, password: u.password });
    if (le) throw new Error(`login ${u.email}: ${le.message}`);
  }
  const { data: me } = await c.auth.getUser();
  if (!me.user) throw new Error("no user after login");
  return { c, userId: me.user.id };
}

async function seed(c: ReturnType<typeof client>, userId: string, label: string) {
  const { data: hh } = await c.from("households").select("id").eq("owner_id", userId).single();
  if (!hh) throw new Error("household missing for " + label);
  const { data: members } = await c.from("household_members").select("id").eq("household_id", hh.id);
  const memberId = members?.[0]?.id;
  const { error: pe } = await c.from("policies").insert({
    owner_id: userId, member_id: memberId, insurer: `Insurer-${label}`,
    model: "Standard", monthly_premium: 100 + label.charCodeAt(0), franchise: 2500,
  });
  if (pe) throw new Error(`policy insert ${label}: ${pe.message}`);
  return { householdId: hh.id, memberId };
}

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("❌", msg); process.exitCode = 1; } else { console.log("✅", msg); }
}

(async () => {
  console.log("→ Signup A & B …");
  const A = await signupAndLogin(userA);
  const B = await signupAndLogin(userB);
  console.log("   A:", A.userId, "  B:", B.userId);

  console.log("→ Seed Policies …");
  const seedA = await seed(A.c, A.userId, "A");
  const seedB = await seed(B.c, B.userId, "B");

  console.log("→ A liest eigene Daten");
  const aHH = await A.c.from("households").select("*");
  const aMems = await A.c.from("household_members").select("*");
  const aPols = await A.c.from("policies").select("*");
  assert(!aHH.error && (aHH.data?.length ?? 0) === 1, "A sieht genau 1 Haushalt");
  assert(!aMems.error && (aMems.data?.length ?? 0) >= 1, "A sieht eigene Mitglieder");
  assert(!aPols.error && aPols.data?.every((p: any) => p.owner_id === A.userId), "A sieht nur eigene Policen");

  console.log("→ A versucht B's Haushalt/Mitglieder/Policen zu lesen");
  const aSeesBHH = await A.c.from("households").select("*").eq("id", seedB.householdId);
  const aSeesBMem = await A.c.from("household_members").select("*").eq("household_id", seedB.householdId);
  const aSeesBPol = await A.c.from("policies").select("*").eq("owner_id", B.userId);
  assert((aSeesBHH.data?.length ?? 0) === 0, "A sieht NICHT B's Haushalt");
  assert((aSeesBMem.data?.length ?? 0) === 0, "A sieht NICHT B's Mitglieder");
  assert((aSeesBPol.data?.length ?? 0) === 0, "A sieht NICHT B's Policen");

  console.log("→ A versucht B's Policen zu UPDATEn");
  const aUpd = await A.c.from("policies").update({ insurer: "HACKED" }).eq("owner_id", B.userId).select();
  assert((aUpd.data?.length ?? 0) === 0, "A kann KEINE Policen von B ändern");

  console.log("→ A versucht Police mit fremder owner_id zu INSERTen");
  const aFakeIns = await A.c.from("policies").insert({ owner_id: B.userId, insurer: "X" });
  assert(!!aFakeIns.error, "A kann KEINE Policy als B anlegen (RLS lehnt ab)");

  console.log("→ Profiles: A sieht nur eigenes Profil");
  const aProf = await A.c.from("profiles").select("*");
  assert((aProf.data?.length ?? 0) === 1 && aProf.data?.[0]?.id === A.userId, "A sieht genau 1 Profil (eigenes)");

  console.log("→ B Gegencheck");
  const bPols = await B.c.from("policies").select("*");
  assert(bPols.data?.every((p: any) => p.owner_id === B.userId) ?? false, "B sieht nur eigene Policen");

  console.log(process.exitCode ? "\n❌ TESTS FAILED" : "\n✅ Alle RLS-Tests bestanden");
})().catch((e) => { console.error(e); process.exit(1); });
