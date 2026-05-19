"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteEncaissement,
  updateEncaissement,
  type EncaissementFormState,
} from "@/app/(app)/dossiers/[id]/honoraires/actions";
import { formatMontant } from "@/lib/dossier-labels";
import { formatEcheanceLong } from "@/lib/datetime-paris";

export type EncaissementItemProps = {
  id: string;
  date: string;
  montant: string;
  libelle: string | null;
};

export function EncaissementItem(props: EncaissementItemProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      {editing ? (
        <EditForm
          id={props.id}
          initialDate={props.date}
          initialMontant={String(props.montant).replace(".", ",")}
          initialLibelle={props.libelle ?? ""}
          onDone={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">
              {formatEcheanceLong(props.date)}
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-mono text-lg font-semibold text-emerald-700">
                {formatMontant(props.montant)}
              </span>
              {props.libelle ? (
                <span className="text-sm text-slate-700">{props.libelle}</span>
              ) : null}
            </div>
          </div>
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
      )}
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
    <form action={deleteEncaissement} className="flex items-center gap-2">
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
  initialDate,
  initialMontant,
  initialLibelle,
  onDone,
}: {
  id: string;
  initialDate: string;
  initialMontant: string;
  initialLibelle: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    EncaissementFormState | undefined,
    FormData
  >(updateEncaissement, undefined);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state?.ok, onDone]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-2 sm:grid-cols-[170px_140px_1fr]">
        <input
          name="date"
          type="date"
          required
          defaultValue={initialDate}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        <input
          name="montant"
          type="text"
          inputMode="decimal"
          required
          defaultValue={initialMontant}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        <input
          name="libelle"
          type="text"
          defaultValue={initialLibelle}
          placeholder="Libellé (facultatif)"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>
      {state?.fieldErrors?.date ? (
        <p className="text-xs text-red-600">{state.fieldErrors.date}</p>
      ) : null}
      {state?.fieldErrors?.montant ? (
        <p className="text-xs text-red-600">{state.fieldErrors.montant}</p>
      ) : null}
      {state?.fieldErrors?.libelle ? (
        <p className="text-xs text-red-600">{state.fieldErrors.libelle}</p>
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
