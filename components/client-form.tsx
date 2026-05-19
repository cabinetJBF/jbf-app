"use client";

import { useActionState } from "react";
import type {
  ClientFormState,
  createClient,
  updateClient,
} from "@/app/(app)/clients/actions";

type Defaults = {
  id?: string;
  nom?: string | null;
  prenom?: string | null;
  telephone?: string | null;
  email?: string | null;
  alertes?: string | null;
};

export function ClientForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
}: {
  action: typeof createClient | typeof updateClient;
  defaults?: Defaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<
    ClientFormState | undefined,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Prénom"
          name="prenom"
          required
          defaultValue={defaults?.prenom ?? ""}
          error={state?.fieldErrors?.prenom}
        />
        <Field
          label="Nom"
          name="nom"
          required
          defaultValue={defaults?.nom ?? ""}
          error={state?.fieldErrors?.nom}
        />
        <Field
          label="Téléphone"
          name="telephone"
          type="tel"
          required
          defaultValue={defaults?.telephone ?? ""}
          error={state?.fieldErrors?.telephone}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={defaults?.email ?? ""}
          error={state?.fieldErrors?.email}
          hint="Facultatif"
        />
      </div>

      <div>
        <label
          htmlFor="alertes"
          className="block text-sm font-medium text-slate-700"
        >
          Alertes <span className="text-xs text-slate-400">(facultatif)</span>
        </label>
        <textarea
          id="alertes"
          name="alertes"
          rows={2}
          defaultValue={defaults?.alertes ?? ""}
          placeholder="Ex : paie en retard, client difficile, contact familial à privilégier…"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        {state?.fieldErrors?.alertes ? (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.alertes}
          </p>
        ) : null}
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : submitLabel}
        </button>
        <a
          href={cancelHref}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Annuler
        </a>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  error,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {required ? null : (
          <span className="text-xs text-slate-400"> (facultatif)</span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
