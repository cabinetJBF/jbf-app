import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, isNull, not, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients, dossiers, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { ClientForm } from "@/components/client-form";
import { formatDateTimeParis } from "@/lib/format";
import {
  STATUT_LABELS,
  TYPE_PROCEDURE_LABELS,
  type StatutDossier,
  type TypeProcedure,
} from "@/lib/dossier-labels";
import { archiveClient, unarchiveClient, updateClient } from "../actions";

type Params = Promise<{ id: string }>;
const uuidSchema = z.string().uuid();

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
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
      id: clients.id,
      nom: clients.nom,
      prenom: clients.prenom,
      telephone: clients.telephone,
      email: clients.email,
      alertes: clients.alertes,
      createdAt: clients.createdAt,
      archiveLe: clients.archiveLe,
      archiverPrenom: users.prenom,
      archiverNom: users.nom,
    })
    .from(clients)
    .leftJoin(users, eq(clients.archivePar, users.id))
    .where(eq(clients.id, parsedId.data))
    .limit(1);

  if (!row) notFound();

  const dossiersRows = await db
    .select({
      id: dossiers.id,
      numeroDossier: dossiers.numeroDossier,
      typeProcedure: dossiers.typeProcedure,
      juridiction: dossiers.juridiction,
      statut: dossiers.statut,
      archiveLe: dossiers.archiveLe,
      createdAt: dossiers.createdAt,
      associePrenom: users.prenom,
      associeNom: users.nom,
    })
    .from(dossiers)
    .leftJoin(users, eq(dossiers.associeResponsableId, users.id))
    .where(eq(dossiers.clientId, row.id))
    .orderBy(
      sql`CASE WHEN ${dossiers.archiveLe} IS NULL THEN 0 ELSE 1 END`,
      sql`CASE WHEN ${dossiers.statut} = 'en_cours' THEN 0 ELSE 1 END`,
      desc(dossiers.createdAt),
    );

  const isArchived = row.archiveLe !== null;

  return (
    <div className="max-w-4xl">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/clients" className="hover:text-slate-900 hover:underline">
          Clients
        </Link>
        <span className="mx-1">/</span>
        <span>
          {row.nom.toUpperCase()} {row.prenom}
        </span>
      </nav>

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          {row.nom.toUpperCase()} {row.prenom}
        </h1>
        {isArchived ? (
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            Archivé le {row.archiveLe ? formatDateTimeParis(row.archiveLe) : ""}
            {row.archiverPrenom
              ? ` par ${row.archiverPrenom} ${row.archiverNom}`
              : ""}
          </span>
        ) : null}
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Coordonnées</h2>
        <p className="mt-1 text-xs text-slate-500">
          Modifiable. Les changements sont enregistrés en base.
        </p>
        <div className="mt-5">
          <ClientForm
            action={updateClient}
            defaults={row}
            submitLabel="Enregistrer les modifications"
            cancelHref="/clients"
          />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900">
            Dossiers ({dossiersRows.length})
          </h2>
          {!isArchived ? (
            <Link
              href={`/dossiers/nouveau?client=${row.id}`}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              + Nouveau dossier
            </Link>
          ) : null}
        </div>

        {dossiersRows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Aucun dossier pour ce client.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {dossiersRows.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <Link
                    href={`/dossiers/${d.id}`}
                    className="font-mono font-medium text-slate-900 hover:underline"
                  >
                    {d.numeroDossier}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {
                      TYPE_PROCEDURE_LABELS[
                        d.typeProcedure as TypeProcedure
                      ]
                    }{" "}
                    · {d.juridiction}
                    {d.associePrenom
                      ? ` · ${d.associePrenom} ${d.associeNom}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatutBadge statut={d.statut as StatutDossier} />
                  {d.archiveLe ? (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                      Archivé
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">
          Récap financier global
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Total convenu / total encaissé / reste dû tous dossiers confondus.
          Disponible en Phase 3.
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">
          Zone administrative
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Créé le {formatDateTimeParis(row.createdAt)}.
        </p>
        <div className="mt-4">
          {isArchived ? (
            <form action={unarchiveClient}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Restaurer ce client
              </button>
            </form>
          ) : (
            <form action={archiveClient}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
              >
                Archiver ce client
              </button>
            </form>
          )}
          <p className="mt-2 text-xs text-slate-400">
            L&apos;archivage masque le client des listes actives. Aucune donnée
            n&apos;est supprimée.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatutBadge({ statut }: { statut: StatutDossier }) {
  const styles =
    statut === "en_cours"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {STATUT_LABELS[statut]}
    </span>
  );
}
