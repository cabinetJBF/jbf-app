"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createEncaissement,
  type EncaissementFormState,
} from "@/app/(app)/dossiers/[id]/honoraires/actions";
import { getTodayParisIsoDate } from "@/lib/datetime-paris";

export function EncaissementAddForm({ dossierId }: { dossierId: string }) {
  const [state, formAction, pending] = useActionState<
    EncaissementFormState | undefined,
    FormData
  >(createEncaissement, undefined);

  const dateRef = useRef<HTMLInputElement>(null);
  const montantRef = useRef<HTMLInputElement>(null);
  const libelleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      if (montantRef.current) montantRef.current.value = "";
      if (libelleRef.current) libelleRef.current.value = "";
      montantRef.current?.focus();
    }
  }, [state?.ok]);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <input type="hidden" name="dossierId" value={dossierId} />
      <div className="grid gap-3 sm:grid-cols-[170px_140px_1fr_auto]">
        <div>
          <label
            htmlFor="date"
            className="block text-xs font-medium text-slate-700"
          >
            Date
          </label>
          <input
            ref={dateRef}
            id="date"
            name="date"
            type="date"
            required
            defaultValue={getTodayParisIsoDate()}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {state?.fieldErrors?.date ? (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.date}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="montant"
            className="block text-xs font-medium text-slate-700"
          >
            Montant (€)
          </label>
          <input
            ref={montantRef}
            id="montant"
            name="montant"
            type="text"
            inputMode="decimal"
            required
            placeholder="1500,00"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {state?.fieldErrors?.montant ? (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.montant}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="libelle"
            className="block text-xs font-medium text-slate-700"
          >
            Libellé <span className="text-slate-400">(facultatif)</span>
          </label>
          <input
            ref={libelleRef}
            id="libelle"
            name="libelle"
            type="text"
            placeholder="Ex : Acompte, Solde, Provision pour audience…"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {state?.fieldErrors?.libelle ? (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.libelle}
            </p>
          ) : null}
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {pending ? "…" : "Ajouter"}
          </button>
        </div>
      </div>
      {state?.error ? (
        <p
          role="alert"
          className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
