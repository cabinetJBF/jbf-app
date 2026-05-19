export const TYPE_PROCEDURE_LABELS = {
  garde_a_vue: "Garde à vue",
  instruction: "Instruction",
  correctionnelle: "Correctionnelle",
  criminelle: "Criminelle",
  comparution_immediate: "Comparution immédiate",
  appel: "Appel",
  cassation: "Cassation",
  autre: "Autre",
} as const;

export const TYPE_PROCEDURE_VALUES = [
  "garde_a_vue",
  "instruction",
  "correctionnelle",
  "criminelle",
  "comparution_immediate",
  "appel",
  "cassation",
  "autre",
] as const;

export type TypeProcedure = (typeof TYPE_PROCEDURE_VALUES)[number];

export const STATUT_LABELS = {
  en_cours: "En cours",
  cloture: "Clôturé",
} as const;

export const STATUT_VALUES = ["en_cours", "cloture"] as const;
export type StatutDossier = (typeof STATUT_VALUES)[number];

const CURRENCY_FR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export function formatMontant(value: string | number | null): string {
  if (value === null || value === "" || value === undefined) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return CURRENCY_FR.format(num);
}
