"use client";

import Link from "next/link";
import { useState } from "react";
import { formatAudienceDateParis } from "@/lib/datetime-paris";

export type DashboardAudience = {
  id: string;
  dateHeureUtc: string;
  dossierId: string;
  dossierIntitule: string | null;
  clientNom: string;
  clientPrenom: string;
  associePrenom: string | null;
  associeNom: string | null;
};

const INITIAL = 5;

export function DashboardAudienceList({
  items,
}: {
  items: DashboardAudience[];
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, INITIAL);
  const extra = items.length - INITIAL;

  return (
    <>
      <ul className="mt-3 divide-y divide-slate-100">
        {visible.map((a) => (
          <li key={a.id} className="py-2">
            <Link
              href={`/dossiers/${a.dossierId}/audiences`}
              className="-mx-1 block rounded px-1 hover:bg-slate-50"
            >
              <p className="text-xs font-medium text-amber-700">
                {formatAudienceDateParis(a.dateHeureUtc)}
              </p>
              <p className="mt-0.5 text-sm text-slate-700">
                {a.dossierIntitule ?? (
                  <span className="italic text-slate-400">(sans intitulé)</span>
                )}{" "}
                <span className="text-slate-500">
                  — {a.clientNom.toUpperCase()} {a.clientPrenom}
                </span>
              </p>
              {a.associePrenom ? (
                <p className="mt-0.5 text-xs text-slate-400">
                  Suivi par {a.associePrenom} {a.associeNom}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
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
