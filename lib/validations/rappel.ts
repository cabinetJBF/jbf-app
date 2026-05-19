import { z } from "zod";

export const rappelInputSchema = z.object({
  titre: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(240, "Le titre est trop long"),
  dateEcheance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
});

export type RappelInput = z.infer<typeof rappelInputSchema>;
