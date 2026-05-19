import Link from "next/link";
import { and, eq, gt, isNotNull, isNull, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, dossiers, encaissements, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { formatMontant } from "@/lib/dossier-labels";

export const dynamic = "force-dynamic";

export default async function HonorairesPage() {
  await requireUser();

  const restePerDossier = db
    .select({
      dossierId: dossiers.id,
      numeroDossier: dossiers.numeroDossier,
      intitule: dossiers.intitule,
      montantConvenu: dossiers.montantConvenu,
      totalEncaisse: sql<string>`COALESCE((
        SELECT SUM(${encaissements.montant})
        FROM ${encaissements}
        WHERE ${encaissements.dossierId} = ${dossiers.id}
      ), 0)`.as("totalEncaisse"),
      clientId: clients.id,
      clientNom: clients.nom,
      clientPrenom: clients.prenom,
      associeId: users.id,
      associePrenom: users.prenom,
      associeNom: users.nom,
    })
    .from(dossiers)
    .innerJoin(clients, eq(dossiers.clientId, clients.id))
    .leftJoin(users, eq(dossiers.associeResponsableId, users.id))
    .where(
      and(
        isNull(dossiers.archiveLe),
        isNotNull(dossiers.montantConvenu),
        gt(dossiers.montantConvenu, sql`0`),
      ),
    )
    .as("rd");

  const rows = await db
    .select({
      dossierId: restePerDossier.dossierId,
      numeroDossier: restePerDossier.numeroDossier,
      intitule: restePerDossier.intitule,
      montantConvenu: restePerDossier.montantConvenu,
      totalEncaisse: restePerDossier.totalEncaisse,
      clientId: restePerDossier.clientId,
      clientNom: restePerDossier.clientNom,
      clientPrenom: restePerDossier.clientPrenom,
      associePrenom: restePerDossier.associePrenom,
      associeNom: restePerDossier.associeNom,
      resteDu: sql<string>`${restePerDossier.montantConvenu} - ${restePerDossier.totalEncaisse}`,
    })
    .from(restePerDossier)
    .where(
      sql`${restePerDossier.montantConvenu} - ${restePerDossier.totalEncaisse} > 0`,
    )
    .orderBy(
      desc(
        sql`${restePerDossier.montantConvenu} - ${restePerDossier.totalEncaisse}`,
      ),
    );

  const totalRestant = rows.reduce(
    (acc, r) => acc + Number(r.resteDu),
    0,
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Honoraires</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dossiers avec un reste dû positif. Triés du plus gros au plus petit.
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 px-4 py-2 ring-1 ring-amber-200">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Total à percevoir
          </p>
          <p className="mt-0.5 font-mono text-xl font-semibold text-amber-900">
            {formatMontant(totalRestant)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Aucun dossier n&apos;a de reste dû. Tous les honoraires sont à
            jour, ou aucun montant convenu n&apos;a été saisi.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Dossier</Th>
                <Th>Client</Th>
                <Th>Associé</Th>
                <ThR>Convenu</ThR>
                <ThR>Encaissé</ThR>
                <ThR>Reste dû</ThR>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.dossierId} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-sm">
                    <Link
                      href={`/dossiers/${r.dossierId}/honoraires`}
                      className="block hover:underline"
                    >
                      <span className="font-medium text-slate-900">
                        {r.intitule ?? (
                          <span className="italic text-slate-400">
                            (sans intitulé)
                          </span>
                        )}
                      </span>
                      <span className="ml-2 font-mono text-xs text-slate-500">
                        {r.numeroDossier}
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm">
                    <Link
                      href={`/clients/${r.clientId}`}
                      className="text-slate-700 hover:underline"
                    >
                      {r.clientNom.toUpperCase()} {r.clientPrenom}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-600">
                    {r.associePrenom ? `${r.associePrenom} ${r.associeNom}` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm text-slate-700">
                    {formatMontant(r.montantConvenu)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm text-emerald-700">
                    {formatMontant(r.totalEncaisse)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm font-semibold text-amber-700">
                    {formatMontant(r.resteDu)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rows.length > 0 ? (
        <p className="mt-3 text-xs text-slate-400">
          {rows.length} dossier{rows.length > 1 ? "s" : ""} avec reste dû.
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

function ThR({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-slate-500"
    >
      {children}
    </th>
  );
}
