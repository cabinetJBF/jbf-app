import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { audiences } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { AudienceAddForm } from "@/components/audience-add-form";
import { AudienceItem } from "@/components/audience-item";
import { utcToParisInputValue } from "@/lib/datetime-paris";

type Params = Promise<{ id: string }>;
const uuidSchema = z.string().uuid();

export default async function DossierAudiencesPage({
  params,
}: {
  params: Params;
}) {
  await requireUser();
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const dossierId = parsedId.data;

  const rows = await db
    .select({
      id: audiences.id,
      dateHeure: audiences.dateHeure,
      notes: audiences.notes,
    })
    .from(audiences)
    .where(eq(audiences.dossierId, dossierId))
    .orderBy(asc(audiences.dateHeure));

  const now = new Date();
  const upcoming = rows.filter((r) => new Date(r.dateHeure) >= now);
  const past = rows.filter((r) => new Date(r.dateHeure) < now).reverse();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-medium text-slate-900">Audiences</h2>
        <p className="mt-1 text-xs text-slate-500">
          Toutes les heures sont en fuseau Europe/Paris. Les rappels automatiques
          par email (J-7, J-3, veille) seront activés à l&apos;étape suivante de
          la Phase 2.
        </p>
      </div>

      <AudienceAddForm dossierId={dossierId} />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Aucune audience pour l&apos;instant. Ajoutez la première ci-dessus.
        </p>
      ) : (
        <div className="space-y-4">
          <Section
            title={`À venir (${upcoming.length})`}
            rows={upcoming}
            past={false}
          />
          <Section
            title={`Passées (${past.length})`}
            rows={past}
            past={true}
          />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  rows,
  past,
}: {
  title: string;
  rows: { id: string; dateHeure: Date | string; notes: string | null }[];
  past: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <ul className="space-y-2">
        {rows.map((r) => {
          const utc =
            typeof r.dateHeure === "string"
              ? r.dateHeure
              : r.dateHeure.toISOString();
          return (
            <li key={r.id}>
              <AudienceItem
                id={r.id}
                dateHeureUtc={utc}
                dateHeureInputValue={utcToParisInputValue(utc)}
                notes={r.notes}
                isPast={past}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
