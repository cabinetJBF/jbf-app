import { z } from "zod";

export const noteInputSchema = z.object({
  contenu: z
    .string()
    .trim()
    .min(1, "Le contenu est requis")
    .max(10000, "Note trop longue (max 10 000 caractères)"),
});

export type NoteInput = z.infer<typeof noteInputSchema>;
