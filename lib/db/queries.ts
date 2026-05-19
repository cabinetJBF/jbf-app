import "server-only";
import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { dossiers } from "@/lib/db/schema";

export async function suggestNextDossierNumber(): Promise<string> {
  const yearStr = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date());
  const prefix = `${yearStr}-`;

  const rows = await db
    .select({ numero: dossiers.numeroDossier })
    .from(dossiers)
    .where(like(dossiers.numeroDossier, `${prefix}%`));

  let max = 0;
  for (const row of rows) {
    const suffix = row.numero.slice(prefix.length);
    const n = Number.parseInt(suffix, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}
