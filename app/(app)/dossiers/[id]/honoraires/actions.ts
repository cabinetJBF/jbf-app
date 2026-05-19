"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { encaissements } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import {
  encaissementInputSchema,
  normalizeMontant,
} from "@/lib/validations/encaissement";

export type EncaissementFormState = {
  error?: string;
  fieldErrors?: { date?: string; montant?: string; libelle?: string };
  ok?: boolean;
};

const createPayloadSchema = encaissementInputSchema.extend({
  dossierId: z.string().uuid("Dossier invalide"),
});

function fieldErrorsFromZod(
  error: z.ZodError,
): EncaissementFormState["fieldErrors"] {
  const acc: EncaissementFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const path = issue.path[0];
    if (path === "date" && !acc.date) acc.date = issue.message;
    if (path === "montant" && !acc.montant) acc.montant = issue.message;
    if (path === "libelle" && !acc.libelle) acc.libelle = issue.message;
  }
  return acc;
}

export async function createEncaissement(
  _prev: EncaissementFormState | undefined,
  formData: FormData,
): Promise<EncaissementFormState> {
  const user = await requireUser();

  const parsed = createPayloadSchema.safeParse({
    dossierId: formData.get("dossierId"),
    date: formData.get("date"),
    montant: formData.get("montant"),
    libelle: formData.get("libelle"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  await db.insert(encaissements).values({
    dossierId: parsed.data.dossierId,
    date: parsed.data.date,
    montant: normalizeMontant(parsed.data.montant),
    libelle: parsed.data.libelle ? parsed.data.libelle : null,
    createdBy: user.id,
  });

  revalidatePath(`/dossiers/${parsed.data.dossierId}/honoraires`);
  revalidatePath("/honoraires");
  return { ok: true };
}

const updatePayloadSchema = encaissementInputSchema.extend({
  id: z.string().uuid(),
});

export async function updateEncaissement(
  _prev: EncaissementFormState | undefined,
  formData: FormData,
): Promise<EncaissementFormState> {
  await requireUser();

  const parsed = updatePayloadSchema.safeParse({
    id: formData.get("id"),
    date: formData.get("date"),
    montant: formData.get("montant"),
    libelle: formData.get("libelle"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const [updated] = await db
    .update(encaissements)
    .set({
      date: parsed.data.date,
      montant: normalizeMontant(parsed.data.montant),
      libelle: parsed.data.libelle ? parsed.data.libelle : null,
    })
    .where(eq(encaissements.id, parsed.data.id))
    .returning({ dossierId: encaissements.dossierId });

  if (updated?.dossierId) {
    revalidatePath(`/dossiers/${updated.dossierId}/honoraires`);
  }
  revalidatePath("/honoraires");
  return { ok: true };
}

const idSchema = z.object({ id: z.string().uuid() });

export async function deleteEncaissement(formData: FormData) {
  await requireUser();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const [deleted] = await db
    .delete(encaissements)
    .where(eq(encaissements.id, parsed.data.id))
    .returning({ dossierId: encaissements.dossierId });

  if (deleted?.dossierId) {
    revalidatePath(`/dossiers/${deleted.dossierId}/honoraires`);
  }
  revalidatePath("/honoraires");
}
