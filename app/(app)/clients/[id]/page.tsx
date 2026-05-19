import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { ClientForm } from "@/components/client-form";
import { formatDateTimeParis } from "@/lib/format";
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

  const isArchived = row.archiveLe !== null;

  return (
    <div className="max-w-3xl">
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
          Modifiable. Les changements sont enregistrés en base et tracés.
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

      <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Dossiers</h2>
        <p className="mt-1 text-sm text-slate-500">
          La liste des dossiers de ce client apparaîtra ici. Module Dossiers
          en cours de développement (Phase 1, étape suivante).
        </p>
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
            n&apos;est supprimée. La suppression définitive n&apos;est pas
            possible si le client a des dossiers (à venir Phase 1).
          </p>
        </div>
      </section>
    </div>
  );
}
