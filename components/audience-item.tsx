"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteAudience,
  updateAudience,
  type AudienceFormState,
} from "@/app/(app)/dossiers/[id]/audiences/actions";
import { formatAudienceDateParis } from "@/lib/datetime-paris";

export type AudienceItemProps = {
  id: string;
  dateHeureUtc: string;
  dateHeureInputValue: string;
  notes: string | null;
  isPast: boolean;
};

export function AudienceItem(props: AudienceItemProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <article
      className={`rounded-lg border bg-white p-4 ${
        props.isPast
          ? "border-slate-200 opacity-70"
          : "border-slate-200"
      }`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <div className="font-medium text-slate-900">
          {formatAudienceDateParis(props.dateHeureUtc)}
          {props.isPast ? (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Passée
            </span>
          ) : null}
        </div>
        {!editing ? (
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              Modifier
            </button>
            <DeleteButton
              id={props.id}
              confirming={confirmingDelete}
              onAskConfirm={() => setConfirmingDelete(true)}
              onCancel={() => setConfirmingDelete(false)}
            />
          </div>
        ) : null}
      </header>

      {editing ? (
        <EditForm
          id={props.id}
          initialDateInput={props.dateHeureInputValue}
          initialNotes={props.notes ?? ""}
          onDone={() => setEditing(false)}
        />
      ) : props.notes ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
          {props.notes}
        </p>
      ) : null}
    </article>
  );
}

function DeleteButton({
  id,
  confirming,
  onAskConfirm,
  onCancel,
}: {
  id: string;
  confirming: boolean;
  onAskConfirm: () => void;
  onCancel: () => void;
}) {
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={onAskConfirm}
        className="font-medium text-red-600 hover:underline"
      >
        Supprimer
      </button>
    );
  }
  return (
    <form action={deleteAudience} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-slate-600">Confirmer ?</span>
      <button
        type="submit"
        className="rounded-md bg-red-600 px-2 py-0.5 font-medium text-white hover:bg-red-700"
      >
        Oui, supprimer
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="font-medium text-slate-600 hover:underline"
      >
        Annuler
      </button>
    </form>
  );
}

function EditForm({
  id,
  initialDateInput,
  initialNotes,
  onDone,
}: {
  id: string;
  initialDateInput: string;
  initialNotes: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    AudienceFormState | undefined,
    FormData
  >(updateAudience, undefined);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-slate-700">
            Date et heure
          </label>
          <input
            name="dateHeure"
            type="datetime-local"
            required
            defaultValue={initialDateInput}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {state?.fieldErrors?.dateHeure ? (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.dateHeure}
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            Notes
          </label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={initialNotes}
            className="mt-1 block w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>
      {state?.error ? (
        <p className="text-xs text-red-600">{state.error}</p>
      ) : null}
      <div className="flex items-center gap-2">
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
