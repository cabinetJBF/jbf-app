import { z } from "zod";
import {
  STATUT_VALUES,
  TYPE_PROCEDURE_VALUES,
} from "@/lib/dossier-labels";

export const dossierInputSchema = z
  .object({
    numeroDossier: z
      .string()
      .trim()
      .min(1, "Le numéro de dossier est requis")
      .max(40, "Le numéro est trop long"),
    intitule: z
      .string()
      .trim()
      .min(1, "L'intitulé du dossier est requis")
      .max(200, "L'intitulé est trop long"),
    clientId: z.string().uuid("Client invalide"),
    typeProcedure: z.enum(TYPE_PROCEDURE_VALUES, {
      message: "Type de procédure invalide",
    }),
    typeProcedureAutre: z
      .string()
      .trim()
      .max(120, "Précision trop longue")
      .or(z.literal(""))
      .optional(),
    juridiction: z
      .string()
      .trim()
      .min(1, "La juridiction est requise")
      .max(160, "La juridiction est trop longue"),
    associeResponsableId: z.string().uuid("Associé invalide"),
    statut: z.enum(STATUT_VALUES, {
      message: "Statut invalide",
    }),
    description: z
      .string()
      .trim()
      .max(4000, "Description trop longue")
      .or(z.literal(""))
      .optional(),
    montantConvenu: z
      .string()
      .trim()
      .or(z.literal(""))
      .optional()
      .refine(
        (v) => !v || /^-?\d+([.,]\d{1,2})?$/.test(v),
        "Montant invalide (ex : 5000 ou 5000,50)",
      ),
  })
  .superRefine((data, ctx) => {
    if (data.typeProcedure === "autre" && !data.typeProcedureAutre?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["typeProcedureAutre"],
        message: "Précisez le type de procédure",
      });
    }
  });

export type DossierInput = z.infer<typeof dossierInputSchema>;

export function normalizeMontant(v: string | undefined | null): string | null {
  if (!v) return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  return trimmed.replace(",", ".");
}
