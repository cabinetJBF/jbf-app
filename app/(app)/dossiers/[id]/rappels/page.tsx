import { notFound } from "next/navigation";
import { alias } from "drizzle-orm/pg-core";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { rappels, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { RappelAddForm } from "@/components/rappel-add-form";
import { RappelItem } from "@/components/rappel-item";
import { getTodayParisIsoDate } from "@/lib/datetime-paris";

type Params = Promise<{ id: string }>;
const uuidSchema = z.string().uuid();

export default async function DossierRappelsPage({
  params,
}: {
  params: Params;
}) {
  await requireUser();
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const dossierId = parsedId.data;

  const createur = alias(users, "createur");
  const finisher = alias(users, "finisher");

  const rows = await db
    .select({
      id: rappels.id,
      titre: rappels.titre,
      dateEcheance: rappels.dateEcheance,
      termine: rappels.termine,
      termineLe: rappels.termineLe,
      createurPrenom: createur.prenom,
      createurNom: createur.nom,
      finisherPrenom: finisher.prenom,
      finisherNom: finisher.nom,
    })
    .from(rappels)
    .innerJoin(createur, eq(rappels.createurId, createur.id))
    .leftJoin(finisher, eq(rappels.terminePar, finisher.id))
    .where(eq(rappels.dossierId, dossierId))
    .orderBy(asc(rappels.termine), asc(rappels.dateEcheance), desc(rappels.createdAt));

  const today = getTodayParisIsoDate();
  const actifs = rows.filter((r) => !r.termine);
  const termines = rows.filter((r) => r.termine);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-medium text-slate-900">Rappels</h2>
        <p className="mt-1 text-xs text-slate-500">
          To-dos du dossier (échéances, actions à faire). Visibles par tous les
          associés. Les rappels par email J-3 et le jour J seront activés
          à l&apos;étape suivante.
        </p>
      </div>

      <RappelAddForm dossierId={dossierId} />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Aucun rappel pour l&apos;instant. Ajoutez le premier ci-dessus.
        </p>
      ) : (
        <div className="space-y-4">
          <Section
            title={`À faire (${actifs.length})`}
            rows={actifs}
            today={today}
          />
          <Section
            title={`Terminés (${termines.length})`}
            rows={termines}
            today={today}
          />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  rows,
  today,
}: {
  title: string;
  rows: Array<{
    id: string;
    titre: string;
    dateEcheance: string;
    termine: boolean;
    termineLe: Date | string | null;
    createurPrenom: string;
    createurNom: string;
    finisherPrenom: string | null;
    finisherNom: string | null;
  }>;
  today: string;
}) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <ul className="space-y-2">
        {rows.map((r) => {
          const termineLe = r.termineLe
            ? typeof r.termineLe === "string"
              ? r.termineLe
              : r.termineLe.toISOString()
            : null;
          return (
            <li key={r.id}>
              <RappelItem
                id={r.id}
                titre={r.titre}
                dateEcheance={r.dateEcheance}
                termine={r.termine}
                termineLe={termineLe}
                terminePar={
                  r.finisherPrenom && r.finisherNom
                    ? { prenom: r.finisherPrenom, nom: r.finisherNom }
                    : null
                }
                createur={{
                  prenom: r.createurPrenom,
                  nom: r.createurNom,
                }}
                today={today}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
