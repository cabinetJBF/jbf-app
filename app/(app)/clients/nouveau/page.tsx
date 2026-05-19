import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { ClientForm } from "@/components/client-form";
import { createClient } from "../actions";

export default async function NewClientPage() {
  await requireUser();

  return (
    <div className="max-w-2xl">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/clients" className="hover:text-slate-900 hover:underline">
          Clients
        </Link>
        <span className="mx-1">/</span>
        <span>Nouveau client</span>
      </nav>

      <h1 className="text-2xl font-semibold text-slate-900">Nouveau client</h1>
      <p className="mt-1 text-sm text-slate-500">
        Renseignez les coordonnées du client. Les dossiers seront rattachés
        ensuite.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <ClientForm
          action={createClient}
          submitLabel="Créer le client"
          cancelHref="/clients"
        />
      </div>
    </div>
  );
}
