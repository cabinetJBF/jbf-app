"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteRappel,
  toggleRappelTermine,
  updateRappel,
  type RappelFormState,
} from "@/app/(app)/dossiers/[id]/rappels/actions";
import { formatDateTimeParis } from "@/lib/format";
import { formatEcheanceLong } from "@/lib/datetime-paris";

export type RappelItemProps = {
  id: string;
  titre: string;
  dateEcheance: string;
  termine: boolean;
  termineLe: string | null;
  terminePar: { prenom: string; nom: string } | null;
  createur: { prenom: string; nom: string };
  today: string;
};

export function RappelItem(props: RappelItemProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isOverdue = !props.termine && props.dateEcheance < props.today;
  const isToday = !props.termine && props.dateEcheance === props.today;

  let dateStyle = "text-slate-600";
  if (isOverdue) dateStyle = "text-red-700 font-medium";
  else if (isToday) dateStyle = "text-amber-700 font-medium";

  return (
    <article
      className={`rounded-lg border bg-white p-4 ${
        props.termine ? "border-slate-200 opacity-60" : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <form action={toggleRappelTermine} className="mt-0.5 flex-shrink-0">
          <input type="hidden" name="id" value={props.id} />
          <button
            type="submit"
            aria-label={
              props.termine ? "Marquer comme à faire" : "Marquer comme fait"
            }
            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
              props.termine
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-300 bg-white hover:border-slate-500"
            }`}
          >
            {props.termine ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06l3.22 3.22 6.72-6.72a.75.75 0 0 1 1.06 0Z" />
              </svg>
            ) : null}
          </button>
        </form>

        <div className="min-w-0 flex-1">
          {editing ? (
            <EditForm
              id={props.id}
              initialTitre={props.titre}
              initialDate={props.dateEcheance}
              onDone={() => setEditing(false)}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p
                  className={`text-sm ${
                    props.termine
                      ? "text-slate-500 line-through"
                      : "text-slate-900"
                  }`}
                >
                  {props.titre}
                </p>
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
              </div>
              <p className={`mt-1 text-xs ${dateStyle}`}>
                Échéance : {formatEcheanceLong(props.dateEcheance)}
                {isOverdue ? " · En retard" : isToday ? " · Aujourd'hui" : ""}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Créé par {props.createur.prenom} {props.createur.nom}
                {props.termine && props.termineLe && props.terminePar
                  ? ` · Terminé le ${formatDateTimeParis(props.termineLe)} par ${props.terminePar.prenom} ${props.terminePar.nom}`
                  : ""}
              </p>
            </>
          )}
        </div>
      </div>
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
    <form action={deleteRappel} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-slate-600">Confirmer ?</span>
      <button
        type="submit"
        className="rounded-md bg-red-600 px-2 py-0.5 font-medium text-white hover:bg-red-700"
      >
        Oui
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
  initialTitre,
  initialDate,
  onDone,
}: {
  id: string;
  initialTitre: string;
  initialDate: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    RappelFormState | undefined,
    FormData
  >(updateRappel, undefined);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
        <input
          name="titre"
          type="text"
          required
          defaultValue={initialTitre}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        <input
          name="dateEcheance"
          type="date"
          required
          defaultValue={initialDate}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>
      {state?.fieldErrors?.titre ? (
        <p className="text-xs text-red-600">{state.fieldErrors.titre}</p>
      ) : null}
      {state?.fieldErrors?.dateEcheance ? (
        <p className="text-xs text-red-600">{state.fieldErrors.dateEcheance}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "…" : "Enregistrer"}
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
