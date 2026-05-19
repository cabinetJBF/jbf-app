"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createAudience,
  type AudienceFormState,
} from "@/app/(app)/dossiers/[id]/audiences/actions";

export function AudienceAddForm({ dossierId }: { dossierId: string }) {
  const [state, formAction, pending] = useActionState<
    AudienceFormState | undefined,
    FormData
  >(createAudience, undefined);

  const dateRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.ok) {
      if (dateRef.current) dateRef.current.value = "";
      if (notesRef.current) notesRef.current.value = "";
      dateRef.current?.focus();
    }
  }, [state?.ok]);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <input type="hidden" name="dossierId" value={dossierId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label
            htmlFor="dateHeure"
            className="block text-xs font-medium text-slate-700"
          >
            Date et heure (heure de Paris)
          </label>
          <input
            ref={dateRef}
            id="dateHeure"
            name="dateHeure"
            type="datetime-local"
            required
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {state?.fieldErrors?.dateHeure ? (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.dateHeure}
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="block text-xs font-medium text-slate-700"
          >
            Notes <span className="text-slate-400">(facultatif)</span>
          </label>
          <textarea
            ref={notesRef}
            id="notes"
            name="notes"
            rows={2}
            placeholder="Salle, chambre, n° rôle, instructions au stagiaire…"
            className="mt-1 block w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {state?.fieldErrors?.notes ? (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.notes}
            </p>
          ) : null}
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
      <div className="mt-3 flex items-center justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Ajouter l'audience"}
        </button>
      </div>
    </form>
  );
}
