import Link from "next/link";
import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { suggestNextDossierNumber } from "@/lib/db/queries";
import { DossierForm } from "@/components/dossier-form";
import { createDossier } from "../actions";

type SearchParams = Promise<{ client?: string }>;

export default async function NewDossierPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const currentUser = await requireUser();
  const { client: prefilledClientId } = await searchParams;

  const [clientList, associeList, numeroSuggestion] = await Promise.all([
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
      .select({
        id: users.id,
        prenom: users.prenom,
        nom: users.nom,
      })
      .from(users)
      .where(eq(users.actif, true))
      .orderBy(asc(users.nom)),
    suggestNextDossierNumber(),
  ]);

  const clientOptions = clientList.map((c) => ({
    id: c.id,
    label: `${c.nom.toUpperCase()} ${c.prenom}`,
  }));
  const associeOptions = associeList.map((u) => ({
    id: u.id,
    label: `${u.prenom} ${u.nom}`,
  }));

  return (
    <div className="max-w-3xl">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/dossiers" className="hover:text-slate-900 hover:underline">
          Dossiers
        </Link>
        <span className="mx-1">/</span>
        <span>Nouveau dossier</span>
      </nav>

      <h1 className="text-2xl font-semibold text-slate-900">Nouveau dossier</h1>
      <p className="mt-1 text-sm text-slate-500">
        Renseignez les informations clés. Vous pourrez ajouter audiences, notes,
        rappels et encaissements depuis la fiche.
      </p>

      {clientOptions.length === 0 ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Vous devez créer au moins un client avant de pouvoir créer un dossier.
          <div className="mt-3">
            <Link
              href="/clients/nouveau"
              className="inline-block rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              + Créer un client
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <DossierForm
            action={createDossier}
            defaults={{
              clientId: prefilledClientId,
              associeResponsableId: currentUser.id,
              statut: "en_cours",
            }}
            clients={clientOptions}
            associes={associeOptions}
            submitLabel="Créer le dossier"
            cancelHref="/dossiers"
            numeroSuggestion={numeroSuggestion}
          />
        </div>
      )}
    </div>
  );
}
