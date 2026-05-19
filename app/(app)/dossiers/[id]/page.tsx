import { notFound } from "next/navigation";
import { asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients, dossiers, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { DossierForm } from "@/components/dossier-form";
import { formatDateTimeParis } from "@/lib/format";
import {
  archiveDossier,
  unarchiveDossier,
  updateDossier,
} from "../actions";

type Params = Promise<{ id: string }>;
const uuidSchema = z.string().uuid();

export default async function DossierApercuPage({
  params,
}: {
  params: Params;
}) {
  await requireUser();
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const [row] = await db
    .select({
      id: dossiers.id,
      numeroDossier: dossiers.numeroDossier,
      intitule: dossiers.intitule,
      clientId: dossiers.clientId,
      typeProcedure: dossiers.typeProcedure,
      typeProcedureAutre: dossiers.typeProcedureAutre,
      juridiction: dossiers.juridiction,
      associeResponsableId: dossiers.associeResponsableId,
      statut: dossiers.statut,
      description: dossiers.description,
      montantConvenu: dossiers.montantConvenu,
      createdAt: dossiers.createdAt,
      archiveLe: dossiers.archiveLe,
    })
    .from(dossiers)
    .where(eq(dossiers.id, parsedId.data))
    .limit(1);

  if (!row) notFound();

  const [clientList, associeList] = await Promise.all([
    db
      .select({
        id: clients.id,
        nom: clients.nom,
        prenom: clients.prenom,
      })
      .from(clients)
      .where(isNull(clients.archiveLe))
      .orderBy(asc(clients.nom), asc(clients.prenom)),
    db
      .select({ id: users.id, prenom: users.prenom, nom: users.nom })
      .from(users)
      .where(eq(users.actif, true))
      .orderBy(asc(users.nom)),
  ]);

  const clientOptions = clientList.map((c) => ({
    id: c.id,
    label: `${c.nom.toUpperCase()} ${c.prenom}`,
  }));
  const associeOptions = associeList.map((u) => ({
    id: u.id,
    label: `${u.prenom} ${u.nom}`,
  }));

  const defaults = {
    id: row.id,
    numeroDossier: row.numeroDossier,
    intitule: row.intitule,
    clientId: row.clientId,
    typeProcedure: row.typeProcedure,
    typeProcedureAutre: row.typeProcedureAutre,
    juridiction: row.juridiction,
    associeResponsableId: row.associeResponsableId,
    statut: row.statut,
    description: row.description,
    montantConvenu: row.montantConvenu,
  };

  const isArchived = row.archiveLe !== null;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">
          Informations du dossier
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Modifiez n&apos;importe quel champ ci-dessous puis enregistrez.
        </p>
        <div className="mt-5">
          <DossierForm
            action={updateDossier}
            defaults={defaults}
            clients={clientOptions}
            associes={associeOptions}
            submitLabel="Enregistrer les modifications"
            cancelHref="/dossiers"
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">
          Zone administrative
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Créé le {formatDateTimeParis(row.createdAt)}.
        </p>
        <div className="mt-4">
          {isArchived ? (
            <form action={unarchiveDossier}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Restaurer ce dossier
              </button>
            </form>
          ) : (
            <form action={archiveDossier}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
              >
                Archiver ce dossier
              </button>
            </form>
          )}
          <p className="mt-2 text-xs text-slate-400">
            L&apos;archivage masque le dossier des listes actives. Aucune donnée
            n&apos;est supprimée.
          </p>
        </div>
      </section>
    </div>
  );
}
