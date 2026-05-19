import { notFound } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { dossiers, encaissements } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { EncaissementAddForm } from "@/components/encaissement-add-form";
import { EncaissementItem } from "@/components/encaissement-item";
import { formatMontant } from "@/lib/dossier-labels";

type Params = Promise<{ id: string }>;
const uuidSchema = z.string().uuid();

export default async function DossierHonorairesPage({
  params,
}: {
  params: Params;
}) {
  await requireUser();
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const dossierId = parsedId.data;

  const [dossierInfo] = await db
    .select({
      id: dossiers.id,
      montantConvenu: dossiers.montantConvenu,
    })
    .from(dossiers)
    .where(eq(dossiers.id, dossierId))
    .limit(1);

  if (!dossierInfo) notFound();

  const rows = await db
    .select({
      id: encaissements.id,
      date: encaissements.date,
      montant: encaissements.montant,
      libelle: encaissements.libelle,
    })
    .from(encaissements)
    .where(eq(encaissements.dossierId, dossierId))
    .orderBy(desc(encaissements.date));

  const [totals] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${encaissements.montant}), 0)`,
    })
    .from(encaissements)
    .where(eq(encaissements.dossierId, dossierId));

  const totalEncaisse = Number(totals?.total ?? 0);
  const montantConvenu = dossierInfo.montantConvenu
    ? Number(dossierInfo.montantConvenu)
    : null;
  const resteDu =
    montantConvenu !== null ? montantConvenu - totalEncaisse : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-medium text-slate-900">Honoraires</h2>
        <p className="mt-1 text-xs text-slate-500">
          Suivi des encaissements pour ce dossier. Pas de génération de
          facture — c&apos;est uniquement un registre.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Montant convenu"
          value={montantConvenu !== null ? formatMontant(montantConvenu) : "—"}
          tone="neutral"
          hint={
            montantConvenu === null
              ? "Renseignez le montant convenu dans l'onglet Aperçu"
              : undefined
          }
        />
        <SummaryCard
          label="Total encaissé"
          value={formatMontant(totalEncaisse)}
          tone="positive"
          hint={`${rows.length} encaissement${rows.length > 1 ? "s" : ""}`}
        />
        <SummaryCard
          label="Reste dû"
          value={resteDu !== null ? formatMontant(resteDu) : "—"}
          tone={
            resteDu === null
              ? "neutral"
              : resteDu > 0
                ? "warning"
                : "positive"
          }
          hint={
            resteDu !== null && resteDu < 0
              ? "Trop perçu (à régulariser)"
              : undefined
          }
        />
      </div>

      <EncaissementAddForm dossierId={dossierId} />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Aucun encaissement enregistré. Ajoutez le premier ci-dessus.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <EncaissementItem
                id={r.id}
                date={r.date}
                montant={r.montant}
                libelle={r.libelle}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "neutral" | "positive" | "warning";
  hint?: string;
}) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 font-mono text-xl font-semibold ${valueColor}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
