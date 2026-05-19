import Link from "next/link";
import { and, asc, desc, ilike, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { formatDateParis } from "@/lib/format";

type SearchParams = Promise<{ q?: string; archives?: string }>;

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser();
  const { q, archives } = await searchParams;
  const showArchives = archives === "1";
  const search = q?.trim();

  const baseCondition = showArchives
    ? isNotNull(clients.archiveLe)
    : isNull(clients.archiveLe);

  const condition = search
    ? and(
        baseCondition,
        or(
          ilike(clients.nom, `%${search}%`),
          ilike(clients.prenom, `%${search}%`),
          ilike(clients.telephone, `%${search}%`),
        ),
      )
    : baseCondition;

  const rows = await db
    .select({
      id: clients.id,
      nom: clients.nom,
      prenom: clients.prenom,
      telephone: clients.telephone,
      email: clients.email,
      alertes: clients.alertes,
      createdAt: clients.createdAt,
      archiveLe: clients.archiveLe,
    })
    .from(clients)
    .where(condition)
    .orderBy(
      showArchives ? desc(clients.archiveLe) : asc(clients.nom),
      asc(clients.prenom),
    );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            {showArchives
              ? "Clients archivés."
              : "Liste des clients actifs du cabinet."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={showArchives ? "/clients" : "/clients?archives=1"}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {showArchives ? "Voir les actifs" : "Voir les archivés"}
          </Link>
          <Link
            href="/clients/nouveau"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            + Nouveau client
          </Link>
        </div>
      </div>

      <form
        action="/clients"
        method="get"
        className="mt-6 flex max-w-md items-center gap-2"
      >
        {showArchives ? <input type="hidden" name="archives" value="1" /> : null}
        <input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Rechercher (nom, prénom, téléphone)"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
        >
          Rechercher
        </button>
        {search ? (
          <Link
            href={showArchives ? "/clients?archives=1" : "/clients"}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Effacer
          </Link>
        ) : null}
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">
              {search
                ? `Aucun client ne correspond à "${search}".`
                : showArchives
                  ? "Aucun client archivé."
                  : "Aucun client pour l'instant."}
            </p>
            {!search && !showArchives ? (
              <Link
                href="/clients/nouveau"
                className="mt-4 inline-block rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                + Créer le premier client
              </Link>
            ) : null}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Nom</Th>
                <Th>Téléphone</Th>
                <Th>Email</Th>
                <Th>Alertes</Th>
                <Th>{showArchives ? "Archivé le" : "Créé le"}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm">
                    <Link
                      href={`/clients/${c.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {c.nom.toUpperCase()} {c.prenom}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-700">
                    {c.telephone}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-600">
                    {c.email ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {c.alertes ? (
                      <span className="inline-block max-w-xs truncate rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                        {c.alertes}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">
                    {formatDateParis(
                      (showArchives ? c.archiveLe : c.createdAt) ?? c.createdAt,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rows.length > 0 ? (
        <p className="mt-3 text-xs text-slate-400">
          {rows.length} client{rows.length > 1 ? "s" : ""} affiché
          {rows.length > 1 ? "s" : ""}.
        </p>
      ) : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
    >
      {children}
    </th>
  );
}
