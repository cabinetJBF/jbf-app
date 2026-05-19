"use client";

import { useActionState, useEffect, useState } from "react";
import {
  updateNote,
  type NoteFormState,
} from "@/app/(app)/dossiers/[id]/notes/actions";
import { formatDateTimeParis } from "@/lib/format";

export type NoteItemProps = {
  id: string;
  contenu: string;
  createdAt: string;
  updatedAt: string | null;
  auteur: { id: string; prenom: string; nom: string };
  currentUserId: string;
  revisionCount: number;
};

export function NoteItem(props: NoteItemProps) {
  const isAuthor = props.currentUserId === props.auteur.id;
  const [editing, setEditing] = useState(false);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <div>
          <span className="font-medium text-slate-900">
            {props.auteur.prenom} {props.auteur.nom}
          </span>
          <span className="ml-2 text-xs text-slate-500">
            {formatDateTimeParis(props.createdAt)}
          </span>
          {props.updatedAt ? (
            <span className="ml-2 text-xs text-slate-400">
              · modifié le {formatDateTimeParis(props.updatedAt)}
              {props.revisionCount > 1
                ? ` (${props.revisionCount} modifications)`
                : ""}
            </span>
          ) : null}
        </div>
        {isAuthor && !editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
          >
            Modifier
          </button>
        ) : null}
      </header>

      {editing ? (
        <EditForm
          id={props.id}
          initialContent={props.contenu}
          onDone={() => setEditing(false)}
        />
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">
          {props.contenu}
        </p>
      )}
    </article>
  );
}

function EditForm({
  id,
  initialContent,
  onDone,
}: {
  id: string;
  initialContent: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    NoteFormState | undefined,
    FormData
  >(updateNote, undefined);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="contenu"
        defaultValue={initialContent}
        rows={4}
        required
        autoFocus
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
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
