import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients, dossiers, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import {
  STATUT_LABELS,
  formatTypeProcedure,
  type StatutDossier,
  type TypeProcedure,
} from "@/lib/dossier-labels";
import { DossierTabs } from "@/components/dossier-tabs";

type Params = Promise<{ id: string }>;
const uuidSchema = z.string().uuid();

export default async function DossierLayout({
  params,
  children,
}: {
  params: Params;
  children: React.ReactNode;
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
      typeProcedure: dossiers.typeProcedure,
      typeProcedureAutre: dossiers.typeProcedureAutre,
      juridiction: dossiers.juridiction,
      statut: dossiers.statut,
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
    .where(eq(dossiers.id, parsedId.data))
    .limit(1);

  if (!row) notFound();

  return (
    <div>
      <nav className="mb-3 text-sm text-slate-500">
        <Link href="/dossiers" className="hover:text-slate-900 hover:underline">
          Dossiers
        </Link>
        <span className="mx-1">/</span>
        <span>
          {row.intitule ?? (
            <span className="italic">(sans intitulé)</span>
          )}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {row.intitule ?? (
              <span className="italic text-slate-400">(sans intitulé)</span>
            )}
          </h1>
          <p className="mt-1 text-xs font-mono text-slate-500">
            {row.numeroDossier}
          </p>
          <p className="mt-2 text-sm text-slate-700">
            <Link
              href={`/clients/${row.clientId}`}
              className="font-medium hover:underline"
            >
              {row.clientNom.toUpperCase()} {row.clientPrenom}
            </Link>
            {" — "}
            {formatTypeProcedure(
              row.typeProcedure as TypeProcedure,
              row.typeProcedureAutre,
            )}{" "}
            · {row.juridiction}
            {row.associePrenom ? (
              <>
                {" · "}
                <span className="text-slate-500">
                  Suivi par {row.associePrenom} {row.associeNom}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatutBadge statut={row.statut as StatutDossier} />
          {row.archiveLe ? (
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              Archivé
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <DossierTabs dossierId={row.id} />
      </div>

      <div className="mt-6">{children}</div>
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
