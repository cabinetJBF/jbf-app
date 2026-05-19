import { z } from "zod";

export const audienceInputSchema = z.object({
  dateHeure: z
    .string()
    .min(1, "La date et l'heure sont requises")
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
      "Format de date invalide",
    ),
  notes: z
    .string()
    .trim()
    .max(4000, "Notes trop longues")
    .or(z.literal(""))
    .optional(),
});

export type AudienceInput = z.infer<typeof audienceInputSchema>;
