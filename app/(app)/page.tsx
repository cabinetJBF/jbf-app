import { requireUser } from "@/lib/auth/dal";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Bonjour {user.prenom},
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Bienvenue dans l&apos;outil interne du cabinet.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Mes audiences à venir" hint="7 prochains jours" />
        <Card title="Rappels du jour et à venir" hint="Tous associés" />
        <Card title="Honoraires en attente" hint="Total tous dossiers" />
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Les indicateurs et les listes seront actifs quand les modules
        Audiences, Rappels et Honoraires seront implémentés (Phases 2 et 3).
      </p>
    </div>
  );
}

function Card({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5">
      <h2 className="text-sm font-medium text-slate-700">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
      <p className="mt-4 text-2xl font-semibold text-slate-300">—</p>
    </div>
  );
}
