import Link from "next/link";
import { and, asc, eq, gte, isNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  audiences,
  clients,
  dossiers,
  rappels,
  users,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import {
  formatParisHm,
  formatParisMonthLabel,
  formatParisYmd,
  getCurrentParisMonth,
  getTodayParisIsoDate,
  parisMonthBoundsUtc,
} from "@/lib/datetime-paris";
import { buildCalendarGrid, shiftMonth } from "@/lib/calendar";

type SearchParams = Promise<{ month?: string; associe?: string }>;

const WEEKDAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];
const WEEKDAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export const dynamic = "force-dynamic";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser();
  const { month: monthParam, associe: associeFilter } = await searchParams;

  const current = getCurrentParisMonth();
  let year = current.year;
  let month = current.month;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }

  const { startUtc, endUtc } = parisMonthBoundsUtc(year, month);

  const audienceCondition = and(
    gte(audiences.dateHeure, startUtc),
    lt(audiences.dateHeure, endUtc),
    isNull(dossiers.archiveLe),
    associeFilter ? eq(dossiers.associeResponsableId, associeFilter) : undefined,
  );

  const audienceRows = await db
    .select({
      id: audiences.id,
      dateHeure: audiences.dateHeure,
      dossierId: dossiers.id,
      dossierIntitule: dossiers.intitule,
      dossierNumero: dossiers.numeroDossier,
      clientNom: clients.nom,
      clientPrenom: clients.prenom,
    })
    .from(audiences)
    .innerJoin(dossiers, eq(audiences.dossierId, dossiers.id))
    .innerJoin(clients, eq(dossiers.clientId, clients.id))
    .where(audienceCondition)
    .orderBy(asc(audiences.dateHeure));

  const monthStartYmd = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = shiftMonth(year, month, 1);
  const monthEndYmd = `${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}-01`;

  const rappelCondition = and(
    gte(rappels.dateEcheance, monthStartYmd),
    lt(rappels.dateEcheance, monthEndYmd),
    isNull(dossiers.archiveLe),
    associeFilter ? eq(dossiers.associeResponsableId, associeFilter) : undefined,
  );

  const rappelRows = await db
    .select({
      id: rappels.id,
      dateEcheance: rappels.dateEcheance,
      titre: rappels.titre,
      termine: rappels.termine,
      dossierId: dossiers.id,
      dossierIntitule: dossiers.intitule,
    })
    .from(rappels)
    .innerJoin(dossiers, eq(rappels.dossierId, dossiers.id))
    .where(rappelCondition)
    .orderBy(asc(rappels.dateEcheance));

  const associeList = await db
    .select({
      id: users.id,
      prenom: users.prenom,
      nom: users.nom,
    })
    .from(users)
    .where(eq(users.actif, true))
    .orderBy(asc(users.nom));

  const todayIso = getTodayParisIsoDate();
  const grid = buildCalendarGrid(year, month, todayIso);

  type EventEntry =
    | {
        type: "audience";
        id: string;
        time: string;
        title: string;
        dossierId: string;
        href: string;
      }
    | {
        type: "rappel";
        id: string;
        title: string;
        termine: boolean;
        dossierId: string;
        href: string;
      };

  const eventsByDay = new Map<string, EventEntry[]>();
  for (const a of audienceRows) {
    const utc =
      typeof a.dateHeure === "string"
        ? a.dateHeure
        : a.dateHeure.toISOString();
    const ymd = formatParisYmd(utc);
    const time = formatParisHm(utc);
    const list = eventsByDay.get(ymd) ?? [];
    list.push({
      type: "audience",
      id: a.id,
      time,
      title: `${a.dossierIntitule ?? "(sans intitulé)"} — ${a.clientNom.toUpperCase()}`,
      dossierId: a.dossierId,
      href: `/dossiers/${a.dossierId}/audiences`,
    });
    eventsByDay.set(ymd, list);
  }
  for (const r of rappelRows) {
    const list = eventsByDay.get(r.dateEcheance) ?? [];
    list.push({
      type: "rappel",
      id: r.id,
      title: `${r.titre} — ${r.dossierIntitule ?? "(sans intitulé)"}`,
      termine: r.termine,
      dossierId: r.dossierId,
      href: `/dossiers/${r.dossierId}/rappels`,
    });
    eventsByDay.set(r.dateEcheance, list);
  }

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const prevParam = `${prev.year}-${String(prev.month).padStart(2, "0")}`;
  const nextParam = `${next.year}-${String(next.month).padStart(2, "0")}`;

  function urlFor(monthKey: string): string {
    const params = new URLSearchParams();
    params.set("month", monthKey);
    if (associeFilter) params.set("associe", associeFilter);
    return `/agenda?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold capitalize text-slate-900">
            {formatParisMonthLabel(year, month)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Audiences et rappels du mois. Cliquez sur un événement pour ouvrir
            le dossier.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={urlFor(prevParam)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            aria-label="Mois précédent"
          >
            ←
          </Link>
          <Link
            href={`/agenda${associeFilter ? `?associe=${associeFilter}` : ""}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Aujourd&apos;hui
          </Link>
          <Link
            href={urlFor(nextParam)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            aria-label="Mois suivant"
          >
            →
          </Link>
        </div>
      </div>

      <form action="/agenda" method="get" className="mt-4 flex items-center gap-2">
        <input
          type="hidden"
          name="month"
          value={`${year}-${String(month).padStart(2, "0")}`}
        />
        <label
          htmlFor="associe"
          className="text-sm font-medium text-slate-700"
        >
          Filtre :
        </label>
        <select
          id="associe"
          name="associe"
          defaultValue={associeFilter ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="">Tous les associés</option>
          {associeList.map((a) => (
            <option key={a.id} value={a.id}>
              {a.prenom} {a.nom}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
        >
          Appliquer
        </button>
        {associeFilter ? (
          <Link
            href={`/agenda?month=${year}-${String(month).padStart(2, "0")}`}
            className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
          >
            Effacer
          </Link>
        ) : null}
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className="px-2 py-2 text-center">
              <span className="hidden sm:inline">{d}</span>
              <span className="inline sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((day) => {
            const events = eventsByDay.get(day.iso) ?? [];
            return (
              <div
                key={day.iso}
                className={`min-h-[90px] border-b border-r border-slate-100 p-1.5 last:border-r-0 ${
                  !day.isCurrentMonth ? "bg-slate-50" : ""
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    day.isToday
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white"
                      : day.isCurrentMonth
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {day.dayNum}
                </div>
                <div className="mt-1 space-y-1">
                  {events.map((e) =>
                    e.type === "audience" ? (
                      <Link
                        key={e.id}
                        href={e.href}
                        title={`${e.time} — ${e.title}`}
                        className="block truncate rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-200"
                      >
                        <span className="font-mono">{e.time}</span>{" "}
                        {e.title}
                      </Link>
                    ) : (
                      <Link
                        key={e.id}
                        href={e.href}
                        title={e.title}
                        className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          e.termine
                            ? "bg-slate-100 text-slate-500 line-through"
                            : "bg-sky-100 text-sky-900 hover:bg-sky-200"
                        }`}
                      >
                        ⏰ {e.title}
                      </Link>
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-100" />
          Audiences
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-sky-100" />
          Rappels
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-slate-900" />
          Aujourd&apos;hui
        </span>
      </div>
    </div>
  );
}
