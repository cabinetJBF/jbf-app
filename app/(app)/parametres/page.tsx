import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accessLogs, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { formatDateTimeParis } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = {
  login: "Connexion",
  login_failed: "Échec de connexion",
  logout: "Déconnexion",
};

const ACTION_STYLES: Record<string, string> = {
  login: "bg-emerald-50 text-emerald-700",
  login_failed: "bg-red-50 text-red-700",
  logout: "bg-slate-100 text-slate-700",
};

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  await requireUser();

  const logs = await db
    .select({
      id: accessLogs.id,
      action: accessLogs.action,
      ip: accessLogs.ip,
      createdAt: accessLogs.createdAt,
      details: accessLogs.details,
      userId: accessLogs.userId,
      userPrenom: users.prenom,
      userNom: users.nom,
      userEmail: users.email,
    })
    .from(accessLogs)
    .leftJoin(users, eq(accessLogs.userId, users.id))
    .orderBy(desc(accessLogs.createdAt))
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Paramètres</h1>
      <p className="mt-1 text-sm text-slate-500">
        Activité du cabinet sur l&apos;outil interne.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-slate-900">
          Historique des connexions
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Les 100 dernières actions enregistrées. Heures en fuseau Europe/Paris.
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {logs.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              Aucune activité enregistrée pour l&apos;instant.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    Date / heure
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    Utilisateur
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    Action
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const userLabel = log.userPrenom
                    ? `${log.userPrenom} ${log.userNom}`
                    : (log.details &&
                        typeof log.details === "object" &&
                        "email" in log.details &&
                        typeof log.details.email === "string"
                        ? `(${log.details.email})`
                        : "—");
                  const actionLabel =
                    ACTION_LABELS[log.action] ?? log.action;
                  const actionStyle =
                    ACTION_STYLES[log.action] ?? "bg-slate-100 text-slate-700";
                  return (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-700">
                        {formatDateTimeParis(log.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-700">
                        {userLabel}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-sm">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionStyle}`}
                        >
                          {actionLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-500">
                        {log.ip ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
