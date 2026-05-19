"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { noteRevisions, notes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { noteInputSchema } from "@/lib/validations/note";

export type NoteFormState = {
  error?: string;
  fieldErrors?: { contenu?: string };
  ok?: boolean;
};

const createPayloadSchema = noteInputSchema.extend({
  dossierId: z.string().uuid("Dossier invalide"),
});

export async function createNote(
  _prev: NoteFormState | undefined,
  formData: FormData,
): Promise<NoteFormState> {
  const user = await requireUser();

  const parsed = createPayloadSchema.safeParse({
    dossierId: formData.get("dossierId"),
    contenu: formData.get("contenu"),
  });

  if (!parsed.success) {
    const fieldErrors: NoteFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "contenu") fieldErrors.contenu = issue.message;
    }
    return {
      error:
        Object.keys(fieldErrors).length === 0
          ? parsed.error.issues[0]?.message
          : undefined,
      fieldErrors,
    };
  }

  await db.insert(notes).values({
    dossierId: parsed.data.dossierId,
    auteurId: user.id,
    contenu: parsed.data.contenu,
  });

  revalidatePath(`/dossiers/${parsed.data.dossierId}/notes`);
  return { ok: true };
}

const updatePayloadSchema = noteInputSchema.extend({
  id: z.string().uuid(),
});

export async function updateNote(
  _prev: NoteFormState | undefined,
  formData: FormData,
): Promise<NoteFormState> {
  const user = await requireUser();

  const parsed = updatePayloadSchema.safeParse({
    id: formData.get("id"),
    contenu: formData.get("contenu"),
  });

  if (!parsed.success) {
    const fieldErrors: NoteFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "contenu") fieldErrors.contenu = issue.message;
    }
    return {
      error:
        Object.keys(fieldErrors).length === 0
          ? parsed.error.issues[0]?.message
          : undefined,
      fieldErrors,
    };
  }

  const [existing] = await db
    .select({
      id: notes.id,
      dossierId: notes.dossierId,
      auteurId: notes.auteurId,
      contenu: notes.contenu,
    })
    .from(notes)
    .where(eq(notes.id, parsed.data.id))
    .limit(1);

  if (!existing) {
    return { error: "Note introuvable" };
  }
  if (existing.auteurId !== user.id) {
    return { error: "Seul l'auteur peut modifier cette note." };
  }
  if (existing.contenu === parsed.data.contenu) {
    return { ok: true };
  }

  await db.insert(noteRevisions).values({
    noteId: existing.id,
    contenuAvant: existing.contenu,
    modifiePar: user.id,
  });

  await db
    .update(notes)
    .set({ contenu: parsed.data.contenu, updatedAt: new Date() })
    .where(eq(notes.id, existing.id));

  revalidatePath(`/dossiers/${existing.dossierId}/notes`);
  return { ok: true };
}
