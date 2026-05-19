"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { dossiers } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import {
  dossierInputSchema,
  normalizeMontant,
} from "@/lib/validations/dossier";

type DossierField =
  | "numeroDossier"
  | "clientId"
  | "typeProcedure"
  | "typeProcedureAutre"
  | "juridiction"
  | "associeResponsableId"
  | "statut"
  | "description"
  | "montantConvenu";

export type DossierFormState = {
  error?: string;
  fieldErrors?: Partial<Record<DossierField, string>>;
};

function readFields(formData: FormData) {
  return {
    numeroDossier: ((formData.get("numeroDossier") ?? "") as string).trim(),
    clientId: (formData.get("clientId") ?? "") as string,
    typeProcedure: (formData.get("typeProcedure") ?? "") as string,
    typeProcedureAutre: ((formData.get("typeProcedureAutre") ?? "") as string).trim(),
    juridiction: ((formData.get("juridiction") ?? "") as string).trim(),
    associeResponsableId: (formData.get("associeResponsableId") ?? "") as string,
    statut: (formData.get("statut") ?? "en_cours") as string,
    description: ((formData.get("description") ?? "") as string).trim(),
    montantConvenu: ((formData.get("montantConvenu") ?? "") as string).trim(),
  };
}

function formatFieldErrors(error: z.ZodError): DossierFormState["fieldErrors"] {
  const acc: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path[0];
    if (typeof path === "string" && !acc[path]) {
      acc[path] = issue.message;
    }
  }
  return acc;
}

export async function createDossier(
  _prev: DossierFormState | undefined,
  formData: FormData,
): Promise<DossierFormState> {
  const user = await requireUser();

  const parsed = dossierInputSchema.safeParse(readFields(formData));
  if (!parsed.success) {
    return { fieldErrors: formatFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  try {
    const [created] = await db
      .insert(dossiers)
      .values({
        numeroDossier: data.numeroDossier,
        clientId: data.clientId,
        typeProcedure: data.typeProcedure,
        typeProcedureAutre:
          data.typeProcedure === "autre"
            ? (data.typeProcedureAutre?.trim() || null)
            : null,
        juridiction: data.juridiction,
        associeResponsableId: data.associeResponsableId,
        statut: data.statut,
        description: data.description ? data.description : null,
        montantConvenu: normalizeMontant(data.montantConvenu),
        createdBy: user.id,
      })
      .returning({ id: dossiers.id });

    revalidatePath("/dossiers");
    revalidatePath(`/clients/${data.clientId}`);
    redirect(`/dossiers/${created.id}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("dossiers_numero_unique")) {
      return {
        fieldErrors: {
          numeroDossier: "Ce numéro de dossier existe déjà",
        },
      };
    }
    throw err;
  }
}

export async function updateDossier(
  _prev: DossierFormState | undefined,
  formData: FormData,
): Promise<DossierFormState> {
  await requireUser();

  const rawId = formData.get("id");
  const idCheck = z.string().uuid().safeParse(rawId);
  if (!idCheck.success) {
    return { error: "Identifiant invalide" };
  }

  const parsed = dossierInputSchema.safeParse(readFields(formData));
  if (!parsed.success) {
    return { fieldErrors: formatFieldErrors(parsed.error) };
  }
  const data = parsed.data;
  const id = idCheck.data;

  try {
    await db
      .update(dossiers)
      .set({
        numeroDossier: data.numeroDossier,
        clientId: data.clientId,
        typeProcedure: data.typeProcedure,
        typeProcedureAutre:
          data.typeProcedure === "autre"
            ? (data.typeProcedureAutre?.trim() || null)
            : null,
        juridiction: data.juridiction,
        associeResponsableId: data.associeResponsableId,
        statut: data.statut,
        description: data.description ? data.description : null,
        montantConvenu: normalizeMontant(data.montantConvenu),
      })
      .where(eq(dossiers.id, id));

    revalidatePath("/dossiers");
    revalidatePath(`/dossiers/${id}`);
    revalidatePath(`/clients/${data.clientId}`);
    return {};
  } catch (err) {
    if (err instanceof Error && err.message.includes("dossiers_numero_unique")) {
      return {
        fieldErrors: {
          numeroDossier: "Ce numéro de dossier existe déjà",
        },
      };
    }
    throw err;
  }
}

const idSchema = z.object({ id: z.string().uuid() });

export async function archiveDossier(formData: FormData) {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const [updated] = await db
    .update(dossiers)
    .set({ archiveLe: new Date(), archivePar: user.id })
    .where(eq(dossiers.id, parsed.data.id))
    .returning({ clientId: dossiers.clientId });

  revalidatePath("/dossiers");
  revalidatePath(`/dossiers/${parsed.data.id}`);
  if (updated?.clientId) {
    revalidatePath(`/clients/${updated.clientId}`);
  }
}

export async function unarchiveDossier(formData: FormData) {
  await requireUser();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const [updated] = await db
    .update(dossiers)
    .set({ archiveLe: null, archivePar: null })
    .where(eq(dossiers.id, parsed.data.id))
    .returning({ clientId: dossiers.clientId });

  revalidatePath("/dossiers");
  revalidatePath(`/dossiers/${parsed.data.id}`);
  if (updated?.clientId) {
    revalidatePath(`/clients/${updated.clientId}`);
  }
}
