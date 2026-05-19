"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createNote,
  type NoteFormState,
} from "@/app/(app)/dossiers/[id]/notes/actions";

export function NoteAddForm({ dossierId }: { dossierId: string }) {
  const [state, formAction, pending] = useActionState<
    NoteFormState | undefined,
    FormData
  >(createNote, undefined);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.ok && textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.focus();
    }
  }, [state?.ok]);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <input type="hidden" name="dossierId" value={dossierId} />
      <label htmlFor="contenu" className="sr-only">
        Nouvelle note
      </label>
      <textarea
        ref={textareaRef}
        id="contenu"
        name="contenu"
        rows={3}
        required
        placeholder="Ajouter une note (faits, observations, points de stratégie…)"
        className="block w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
      />
      {state?.fieldErrors?.contenu ? (
        <p className="mt-1 text-xs text-red-600">
          {state.fieldErrors.contenu}
        </p>
      ) : null}
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
          {pending ? "Enregistrement…" : "Ajouter la note"}
        </button>
      </div>
    </form>
  );
}
