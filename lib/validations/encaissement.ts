import { z } from "zod";

export const encaissementInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  montant: z
    .string()
    .trim()
    .min(1, "Le montant est requis")
    .refine(
      (v) => /^-?\d+([.,]\d{1,2})?$/.test(v),
      "Montant invalide (ex : 1000 ou 1500,50)",
    ),
  libelle: z
    .string()
    .trim()
    .max(160, "Libellé trop long")
    .or(z.literal(""))
    .optional(),
});

export type EncaissementInput = z.infer<typeof encaissementInputSchema>;

export function normalizeMontant(v: string): string {
  return v.trim().replace(",", ".");
}
