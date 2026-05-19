import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type AuthenticatedUser = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
};

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      nom: users.nom,
      prenom: users.prenom,
      actif: users.actif,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user || !user.actif) return null;

  return {
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
  };
});

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
