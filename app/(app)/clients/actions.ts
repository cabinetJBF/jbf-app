"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { clientInputSchema } from "@/lib/validations/client";

export type ClientFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof typeof clientInputSchema.shape, string>>;
};

function readFields(formData: FormData) {
  return {
    nom: (formData.get("nom") ?? "") as string,
    prenom: (formData.get("prenom") ?? "") as string,
    telephone: (formData.get("telephone") ?? "") as string,
    email: (formData.get("email") ?? "") as string,
    alertes: (formData.get("alertes") ?? "") as string,
  };
}

function formatFieldErrors(error: z.ZodError): ClientFormState["fieldErrors"] {
  const acc: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path[0];
    if (typeof path === "string" && !acc[path]) {
      acc[path] = issue.message;
    }
  }
  return acc;
}

export async function createClient(
  _prev: ClientFormState | undefined,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser();

  const parsed = clientInputSchema.safeParse(readFields(formData));
  if (!parsed.success) {
    return { fieldErrors: formatFieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const [created] = await db
    .insert(clients)
    .values({
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      email: data.email ? data.email : null,
      alertes: data.alertes ? data.alertes : null,
      createdBy: user.id,
    })
    .returning({ id: clients.id });

  revalidatePath("/clients");
  redirect(`/clients/${created.id}`);
}

const updateSchema = clientInputSchema.extend({
  id: z.string().uuid(),
});

export async function updateClient(
  _prev: ClientFormState | undefined,
  formData: FormData,
): Promise<ClientFormState> {
  await requireUser();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    ...readFields(formData),
  });
  if (!parsed.success) {
    return { fieldErrors: formatFieldErrors(parsed.error) };
  }

  const { id, ...data } = parsed.data;

  await db
    .update(clients)
    .set({
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      email: data.email ? data.email : null,
      alertes: data.alertes ? data.alertes : null,
    })
    .where(eq(clients.id, id));

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return {};
}

const archiveSchema = z.object({ id: z.string().uuid() });

export async function archiveClient(formData: FormData) {
  const user = await requireUser();
  const parsed = archiveSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  await db
    .update(clients)
    .set({ archiveLe: new Date(), archivePar: user.id })
    .where(eq(clients.id, parsed.data.id));

  revalidatePath("/clients");
  revalidatePath(`/clients/${parsed.data.id}`);
}

export async function unarchiveClient(formData: FormData) {
  await requireUser();
  const parsed = archiveSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  await db
    .update(clients)
    .set({ archiveLe: null, archivePar: null })
    .where(eq(clients.id, parsed.data.id));

  revalidatePath("/clients");
  revalidatePath(`/clients/${parsed.data.id}`);
}
