import Link from "next/link";
import { and, asc, eq, gte, isNotNull, isNull, lt, lte, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  audiences,
  clients,
  dossiers,
  encaissements,
  rappels,
  users,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import {
  getTodayParisIsoDate,
  parisInputToUtc,
} from "@/lib/datetime-paris";
import { formatMontant } from "@/lib/dossier-labels";
import {
  DashboardAudienceList,
  type DashboardAudience,
} from "@/components/dashboard-audience-list";
import {
  DashboardRappelList,
  type DashboardRappel,
} from "@/components/dashboard-rappel-list";

export const dynamic = "force-dynamic";

function addDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + delta);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default async function DashboardPage() {
  const user = await requireUser();

  const todayIso = getTodayParisIsoDate();
  const in30DaysIso = addDaysIso(todayIso, 30);
  const in31DaysIso = addDaysIso(todayIso, 31);

  const startUtc = parisInputToUtc(`${todayIso}T00:00:00`);
  const endUtc = parisInputToUtc(`${in31DaysIso}T00:00:00`);

  // --- Audiences à venir (30 prochains jours, tous associés, dossiers actifs) ---
  const audiencesRows = await db
    .select({
      id: audiences.id,
      dateHeure: audiences.dateHeure,
      dossierId: dossiers.id,
      dossierIntitule: dossiers.intitule,
      clientNom: clients.nom,
      clientPrenom: clients.prenom,
      associePrenom: users.prenom,
      associeNom: users.nom,
    })
    .from(audiences)
    .innerJoin(dossiers, eq(audiences.dossierId, dossiers.id))
    .innerJoin(clients, eq(dossiers.clientId, clients.id))
    .leftJoin(users, eq(dossiers.associeResponsableId, users.id))
    .where(
      and(
        gte(audiences.dateHeure, startUtc),
        lt(audiences.dateHeure, endUtc),
        isNull(dossiers.archiveLe),
      ),
    )
    .orderBy(asc(audiences.dateHeure));

  // --- Rappels du jour et à venir (30 jours, tous associés, non terminés, dossiers actifs) ---
  const rappelsRows = await db
    .select({
      id: rappels.id,
      titre: rappels.titre,
      dateEcheance: rappels.dateEcheance,
      dossierId: dossiers.id,
      dossierIntitule: dossiers.intitule,
      clientNom: clients.nom,
      clientPrenom: clients.prenom,
    })
    .from(rappels)
    .innerJoin(dossiers, eq(rappels.dossierId, dossiers.id))
    .innerJoin(clients, eq(dossiers.clientId, clients.id))
    .where(
      and(
        gte(rappels.dateEcheance, todayIso),
        lte(rappels.dateEcheance, in30DaysIso),
        eq(rappels.termine, false),
        isNull(dossiers.archiveLe),
      ),
    )
    .orderBy(asc(rappels.dateEcheance));

  // --- Honoraires en attente (total reste dû, tous dossiers actifs) ---
  const dossiersWithConvenu = await db
    .select({
      id: dossiers.id,
      montantConvenu: dossiers.montantConvenu,
    })
    .from(dossiers)
    .where(
      and(
        isNull(dossiers.archiveLe),
        isNotNull(dossiers.montantConvenu),
        gt(dossiers.montantConvenu, sql`0`),
      ),
    );

  const sumRows = await db
    .select({
      dossierId: encaissements.dossierId,
      total: sql<string>`SUM(${encaissements.montant})`,
    })
    .from(encaissements)
    .groupBy(encaissements.dossierId);

  const sumByDossier = new Map<string, number>(
    sumRows.map((r) => [r.dossierId, Number(r.total)]),
  );

  let totalRestant = 0;
  let nbDossiersAvecResteDu = 0;
  for (const d of dossiersWithConvenu) {
    const convenu = Number(d.montantConvenu);
    const encaisse = sumByDossier.get(d.id) ?? 0;
    const reste = convenu - encaisse;
    if (reste > 0) {
      totalRestant += reste;
      nbDossiersAvecResteDu += 1;
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Bonjour {user.prenom},
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Aperçu rapide de votre activité.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* Card 1 : Audiences à venir */}
        <Card>
          <CardHeader
            title="Audiences à venir"
            hint="30 prochains jours, tous associés"
            count={audiencesRows.length}
            href={null}
          />
          {audiencesRows.length === 0 ? (
            <CardEmpty>Aucune audience prévue dans les 30 jours.</CardEmpty>
          ) : (
            <DashboardAudienceList
              items={audiencesRows.map<DashboardAudience>((a) => ({
                id: a.id,
                dateHeureUtc:
                  typeof a.dateHeure === "string"
                    ? a.dateHeure
                    : a.dateHeure.toISOString(),
                dossierId: a.dossierId,
                dossierIntitule: a.dossierIntitule,
                clientNom: a.clientNom,
                clientPrenom: a.clientPrenom,
                associePrenom: a.associePrenom,
                associeNom: a.associeNom,
              }))}
            />
          )}
        </Card>

        {/* Card 2 : Rappels */}
        <Card>
          <CardHeader
            title="Rappels du jour et à venir"
            hint="30 prochains jours, tous associés"
            count={rappelsRows.length}
            href={null}
          />
          {rappelsRows.length === 0 ? (
            <CardEmpty>Aucun rappel à traiter dans les 30 jours.</CardEmpty>
          ) : (
            <DashboardRappelList
              todayIso={todayIso}
              items={rappelsRows.map<DashboardRappel>((r) => ({
                id: r.id,
                titre: r.titre,
                dateEcheance: r.dateEcheance,
                dossierId: r.dossierId,
                dossierIntitule: r.dossierIntitule,
                clientNom: r.clientNom,
                clientPrenom: r.clientPrenom,
              }))}
            />
          )}
        </Card>

        {/* Card 3 : Honoraires en attente */}
        <Card>
          <CardHeader
            title="Honoraires en attente"
            hint="Total tous dossiers"
            count={null}
            href="/honoraires"
          />
          <div className="mt-3">
            <p
              className={`font-mono text-2xl font-semibold ${
                totalRestant > 0 ? "text-amber-700" : "text-slate-400"
              }`}
            >
              {formatMontant(totalRestant)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {nbDossiersAvecResteDu === 0
                ? "Aucun dossier avec reste dû."
                : `Sur ${nbDossiersAvecResteDu} dossier${nbDossiersAvecResteDu > 1 ? "s" : ""}.`}
            </p>
            {nbDossiersAvecResteDu > 0 ? (
              <Link
                href="/honoraires"
                className="mt-3 inline-block text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
              >
                Voir le détail →
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      {children}
    </div>
  );
}

function CardHeader({
  title,
  hint,
  count,
  href,
}: {
  title: string;
  hint: string;
  count: number | null;
  href: string | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <div>
        <h2 className="text-sm font-medium text-slate-700">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      </div>
      {count !== null ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {count}
        </span>
      ) : null}
      {href ? (
        <Link
          href={href}
          className="text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          →
        </Link>
      ) : null}
    </div>
  );
}

function CardEmpty({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm italic text-slate-400">{children}</p>;
}
