export type Gender = "female" | "male" | "other";

export type MemberRole = "child" | "youth" | "adult";

export function calculateAge(birthDate: string | null | undefined, ref: Date = new Date()): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--;
  return age;
}

export function deriveRole(age: number | null): MemberRole | null {
  if (age == null) return null;
  if (age < 19) return "child";
  if (age < 26) return "youth";
  return "adult";
}

export const ROLE_LABEL: Record<MemberRole, string> = {
  child: "Kind",
  youth: "Jugendliche:r",
  adult: "Erwachsene:r",
};

export const GENDER_LABEL: Record<Gender, string> = {
  female: "Weiblich",
  male: "Männlich",
  other: "Divers",
};

export const SWISS_CANTONS = [
  "AG","AI","AR","BE","BL","BS","FR","GE","GL","GR","JU","LU","NE","NW","OW",
  "SG","SH","SO","SZ","TG","TI","UR","VD","VS","ZG","ZH",
] as const;
