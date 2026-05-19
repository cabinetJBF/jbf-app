"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createRappel,
  type RappelFormState,
} from "@/app/(app)/dossiers/[id]/rappels/actions";

export function RappelAddForm({ dossierId }: { dossierId: string }) {
  const [state, formAction, pending] = useActionState<
    RappelFormState | undefined,
    FormData
  >(createRappel, undefined);

  const titreRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      if (titreRef.current) titreRef.current.value = "";
      if (dateRef.current) dateRef.current.value = "";
      titreRef.current?.focus();
    }
  }, [state?.ok]);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <input type="hidden" name="dossierId" value={dossierId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <div>
          <label
            htmlFor="titre"
            className="block text-xs font-medium text-slate-700"
          >
            Titre
          </label>
          <input
            ref={titreRef}
            id="titre"
            name="titre"
            type="text"
            required
            placeholder="Ex : Déposer conclusions, Appeler client, Préparer dossier d'instruction…"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {state?.fieldErrors?.titre ? (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.titre}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="dateEcheance"
            className="block text-xs font-medium text-slate-700"
          >
            Échéance
          </label>
          <input
            ref={dateRef}
            id="dateEcheance"
            name="dateEcheance"
            type="date"
            required
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {state?.fieldErrors?.dateEcheance ? (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.dateEcheance}
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
