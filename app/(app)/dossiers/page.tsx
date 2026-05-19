import Link from "next/link";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, dossiers, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import {
  STATUT_LABELS,
  STATUT_VALUES,
  TYPE_PROCEDURE_LABELS,
  TYPE_PROCEDURE_VALUES,
  formatMontant,
  type StatutDossier,
  type TypeProcedure,
} from "@/lib/dossier-labels";

type SearchParams = Promise<{
  q?: string;
  statut?: string;
  type?: string;
  associe?: string;
  archives?: string;
}>;

export const dynamic = "force-dynamic";

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser();
  const { q, statut, type, associe, archives } = await searchParams;
  const showArchives = archives === "1";
  const search = q?.trim();

  const conditions: SQL[] = [];
  conditions.push(
    showArchives ? isNotNull(dossiers.archiveLe) : isNull(dossiers.archiveLe),
  );

  if (search) {
    const condition = or(
      ilike(dossiers.numeroDossier, `%${search}%`),
      ilike(clients.nom, `%${search}%`),
      ilike(clients.prenom, `%${search}%`),
    );
    if (condition) conditions.push(condition);
  }
  if (statut && (STATUT_VALUES as readonly string[]).includes(statut)) {
    conditions.push(eq(dossiers.statut, statut as StatutDossier));
  }
  if (type && (TYPE_PROCEDURE_VALUES as readonly string[]).includes(type)) {
    conditions.push(eq(dossiers.typeProcedure, type as TypeProcedure));
  }
  if (associe) {
    conditions.push(eq(dossiers.associeResponsableId, associe));
  }

  const associeUsers = await db
    .select({
      id: users.id,
      prenom: users.prenom,
      nom: users.nom,
    })
    .from(users)
    .where(eq(users.actif, true))
    .orderBy(asc(users.nom));

  const rows = await db
    .select({
      id: dossiers.id,
      numeroDossier: dossiers.numeroDossier,
      typeProcedure: dossiers.typeProcedure,
      juridiction: dossiers.juridiction,
      statut: dossiers.statut,
      montantConvenu: dossiers.montantConvenu,
      createdAt: dossiers.createdAt,
      archiveLe: dossiers.archiveLe,
      clientId: clients.id,
      clientNom: clients.nom,
      clientPrenom: clients.prenom,
      associePrenom: users.prenom,
      associeNom: users.nom,
    })
    .from(dossiers)
    .innerJoin(clients, eq(dossiers.clientId, clients.id))
    .leftJoin(users, eq(dossiers.associeResponsableId, users.id))
    .where(and(...conditions))
    .orderBy(
      showArchives ? desc(dossiers.archiveLe) : desc(dossiers.createdAt),
    );

  const baseParams = new URLSearchParams();
  if (search) baseParams.set("q", search);
  if (statut) baseParams.set("statut", statut);
  if (type) baseParams.set("type", type);
  if (associe) baseParams.set("associe", associe);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dossiers</h1>
          <p className="mt-1 text-sm text-slate-500">
            {showArchives
              ? "Dossiers archivés."
              : "Liste des dossiers actifs du cabinet."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={
              showArchives
                ? `/dossiers${baseParams.toString() ? "?" + baseParams.toString() : ""}`
                : `/dossiers?${new URLSearchParams({ ...Object.fromEntries(baseParams), archives: "1" }).toString()}`
            }
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {showArchives ? "Voir les actifs" : "Voir les archivés"}
          </Link>
          <Link
            href="/dossiers/nouveau"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            + Nouveau dossier
          </Link>
        </div>
      </div>

      <form
        action="/dossiers"
        method="get"
        className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        {showArchives ? <input type="hidden" name="archives" value="1" /> : null}
        <input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Rechercher (n° dossier, client)"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        <select
          name="statut"
          defaultValue={statut ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="">Tous statuts</option>
          {STATUT_VALUES.map((s) => (
            <option key={s} value={s}>
              {STATUT_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="">Tous types</option>
          {TYPE_PROCEDURE_VALUES.map((t) => (
            <option key={t} value={t}>
              {TYPE_PROCEDURE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          name="associe"
          defaultValue={associe ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="">Tous associés</option>
          {associeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.prenom} {u.nom}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            Filtrer
          </button>
          {search || statut || type || associe ? (
            <Link
              href={showArchives ? "/dossiers?archives=1" : "/dossiers"}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Réinit.
            </Link>
          ) : null}
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">
              {showArchives
                ? "Aucun dossier archivé ne correspond aux filtres."
                : "Aucun dossier ne correspond aux filtres."}
            </p>
            {!search && !statut && !type && !associe && !showArchives ? (
              <Link
                href="/dossiers/nouveau"
                className="mt-4 inline-block rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                + Créer le premier dossier
              </Link>
            ) : null}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>N°</Th>
                <Th>Client</Th>
                <Th>Type</Th>
                <Th>Juridiction</Th>
                <Th>Associé</Th>
                <Th>Statut</Th>
                <Th>Montant</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm">
                    <Link
                      href={`/dossiers/${d.id}`}
                      className="font-mono font-medium text-slate-900 hover:underline"
                    >
                      {d.numeroDossier}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm">
                    <Link
                      href={`/clients/${d.clientId}`}
                      className="text-slate-700 hover:underline"
                    >
                      {d.clientNom.toUpperCase()} {d.clientPrenom}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-600">
                    {TYPE_PROCEDURE_LABELS[d.typeProcedure as TypeProcedure]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-600">
                    {d.juridiction}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-600">
                    {d.associePrenom
                      ? `${d.associePrenom} ${d.associeNom}`
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs">
                    <StatutBadge statut={d.statut as StatutDossier} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs text-slate-700">
                    {formatMontant(d.montantConvenu)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rows.length > 0 ? (
        <p className="mt-3 text-xs text-slate-400">
          {rows.length} dossier{rows.length > 1 ? "s" : ""} affiché
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

function StatutBadge({ statut }: { statut: StatutDossier }) {
  const styles =
    statut === "en_cours"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-2 py-0.5 font-medium ${styles}`}>
      {STATUT_LABELS[statut]}
    </span>
  );
}
