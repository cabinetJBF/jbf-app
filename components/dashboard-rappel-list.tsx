"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEcheanceLong } from "@/lib/datetime-paris";

export type DashboardRappel = {
  id: string;
  titre: string;
  dateEcheance: string;
  dossierId: string;
  dossierIntitule: string | null;
  clientNom: string;
  clientPrenom: string;
};

const INITIAL = 5;

export function DashboardRappelList({
  items,
  todayIso,
}: {
  items: DashboardRappel[];
  todayIso: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, INITIAL);
  const extra = items.length - INITIAL;

  return (
    <>
      <ul className="mt-3 divide-y divide-slate-100">
        {visible.map((r) => {
          const isToday = r.dateEcheance === todayIso;
          return (
            <li key={r.id} className="py-2">
              <Link
                href={`/dossiers/${r.dossierId}/rappels`}
                className="-mx-1 block rounded px-1 hover:bg-slate-50"
              >
                <p
                  className={`text-xs font-medium ${
                    isToday ? "text-amber-700" : "text-sky-700"
                  }`}
                >
                  {formatEcheanceLong(r.dateEcheance)}
                  {isToday ? " · Aujourd'hui" : ""}
                </p>
                <p className="mt-0.5 text-sm text-slate-700">
                  {r.titre}{" "}
                  <span className="text-slate-500">
                    —{" "}
                    {r.dossierIntitule ?? (
                      <span className="italic text-slate-400">
                        (sans intitulé)
                      </span>
                    )}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Client : {r.clientNom.toUpperCase()} {r.clientPrenom}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      {extra > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
        >
          {expanded
            ? "Réduire"
            : `…et ${extra} autre${extra > 1 ? "s" : ""}`}
        </button>
      ) : null}
    </>
  );
}
