import { z } from "zod";

export const clientInputSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(1, "Le nom est requis")
    .max(120, "Le nom est trop long"),
  prenom: z
    .string()
    .trim()
    .min(1, "Le prénom est requis")
    .max(120, "Le prénom est trop long"),
  telephone: z
    .string()
    .trim()
    .min(1, "Le téléphone est requis")
    .max(40, "Le téléphone est trop long"),
  email: z
    .string()
    .trim()
    .max(240, "L'email est trop long")
    .email("Format d'email invalide")
    .or(z.literal(""))
    .optional(),
  alertes: z
    .string()
    .trim()
    .max(500, "Le texte est trop long")
    .or(z.literal(""))
    .optional(),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
