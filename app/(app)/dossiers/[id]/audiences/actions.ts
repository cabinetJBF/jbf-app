"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { audiences } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { audienceInputSchema } from "@/lib/validations/audience";
import { parisInputToUtc } from "@/lib/datetime-paris";

export type AudienceFormState = {
  error?: string;
  fieldErrors?: { dateHeure?: string; notes?: string };
  ok?: boolean;
};

const createPayloadSchema = audienceInputSchema.extend({
  dossierId: z.string().uuid("Dossier invalide"),
});

function fieldErrorsFromZod(error: z.ZodError): AudienceFormState["fieldErrors"] {
  const acc: AudienceFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const path = issue.path[0];
    if (path === "dateHeure" && !acc.dateHeure) acc.dateHeure = issue.message;
    if (path === "notes" && !acc.notes) acc.notes = issue.message;
  }
  return acc;
}

export async function createAudience(
  _prev: AudienceFormState | undefined,
  formData: FormData,
): Promise<AudienceFormState> {
  const user = await requireUser();

  const parsed = createPayloadSchema.safeParse({
    dossierId: formData.get("dossierId"),
    dateHeure: formData.get("dateHeure"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  await db.insert(audiences).values({
    dossierId: parsed.data.dossierId,
    dateHeure: parisInputToUtc(parsed.data.dateHeure),
    notes: parsed.data.notes ? parsed.data.notes : null,
    createdBy: user.id,
  });

  revalidatePath(`/dossiers/${parsed.data.dossierId}/audiences`);
  return { ok: true };
}

const updatePayloadSchema = audienceInputSchema.extend({
  id: z.string().uuid(),
});

export async function updateAudience(
  _prev: AudienceFormState | undefined,
  formData: FormData,
): Promise<AudienceFormState> {
  await requireUser();

  const parsed = updatePayloadSchema.safeParse({
    id: formData.get("id"),
    dateHeure: formData.get("dateHeure"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const [updated] = await db
    .update(audiences)
    .set({
      dateHeure: parisInputToUtc(parsed.data.dateHeure),
      notes: parsed.data.notes ? parsed.data.notes : null,
    })
    .where(eq(audiences.id, parsed.data.id))
    .returning({ dossierId: audiences.dossierId });

  if (updated?.dossierId) {
    revalidatePath(`/dossiers/${updated.dossierId}/audiences`);
  }
  return { ok: true };
}

const idSchema = z.object({ id: z.string().uuid() });

export async function deleteAudience(formData: FormData) {
  await requireUser();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const [deleted] = await db
    .delete(audiences)
    .where(eq(audiences.id, parsed.data.id))
    .returning({ dossierId: audiences.dossierId });

  if (deleted?.dossierId) {
    revalidatePath(`/dossiers/${deleted.dossierId}/audiences`);
  }
}
