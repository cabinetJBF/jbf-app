"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { rappels } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { rappelInputSchema } from "@/lib/validations/rappel";

export type RappelFormState = {
  error?: string;
  fieldErrors?: { titre?: string; dateEcheance?: string };
  ok?: boolean;
};

const createPayloadSchema = rappelInputSchema.extend({
  dossierId: z.string().uuid("Dossier invalide"),
});

function fieldErrorsFromZod(error: z.ZodError): RappelFormState["fieldErrors"] {
  const acc: RappelFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const path = issue.path[0];
    if (path === "titre" && !acc.titre) acc.titre = issue.message;
    if (path === "dateEcheance" && !acc.dateEcheance)
      acc.dateEcheance = issue.message;
  }
  return acc;
}

export async function createRappel(
  _prev: RappelFormState | undefined,
  formData: FormData,
): Promise<RappelFormState> {
  const user = await requireUser();

  const parsed = createPayloadSchema.safeParse({
    dossierId: formData.get("dossierId"),
    titre: formData.get("titre"),
    dateEcheance: formData.get("dateEcheance"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  await db.insert(rappels).values({
    dossierId: parsed.data.dossierId,
    titre: parsed.data.titre,
    dateEcheance: parsed.data.dateEcheance,
    createurId: user.id,
  });

  revalidatePath(`/dossiers/${parsed.data.dossierId}/rappels`);
  return { ok: true };
}

const updatePayloadSchema = rappelInputSchema.extend({
  id: z.string().uuid(),
});

export async function updateRappel(
  _prev: RappelFormState | undefined,
  formData: FormData,
): Promise<RappelFormState> {
  await requireUser();

  const parsed = updatePayloadSchema.safeParse({
    id: formData.get("id"),
    titre: formData.get("titre"),
    dateEcheance: formData.get("dateEcheance"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const [updated] = await db
    .update(rappels)
    .set({
      titre: parsed.data.titre,
      dateEcheance: parsed.data.dateEcheance,
    })
    .where(eq(rappels.id, parsed.data.id))
    .returning({ dossierId: rappels.dossierId });

  if (updated?.dossierId) {
    revalidatePath(`/dossiers/${updated.dossierId}/rappels`);
  }
  return { ok: true };
}

const idSchema = z.object({ id: z.string().uuid() });

export async function toggleRappelTermine(formData: FormData) {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const [existing] = await db
    .select({
      id: rappels.id,
      dossierId: rappels.dossierId,
      termine: rappels.termine,
    })
    .from(rappels)
    .where(eq(rappels.id, parsed.data.id))
    .limit(1);

  if (!existing) return;

  await db
    .update(rappels)
    .set(
      existing.termine
        ? { termine: false, terminePar: null, termineLe: null }
        : { termine: true, terminePar: user.id, termineLe: new Date() },
    )
    .where(eq(rappels.id, existing.id));

  revalidatePath(`/dossiers/${existing.dossierId}/rappels`);
}

export async function deleteRappel(formData: FormData) {
  await requireUser();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const [deleted] = await db
    .delete(rappels)
    .where(eq(rappels.id, parsed.data.id))
    .returning({ dossierId: rappels.dossierId });

  if (deleted?.dossierId) {
    revalidatePath(`/dossiers/${deleted.dossierId}/rappels`);
  }
}
