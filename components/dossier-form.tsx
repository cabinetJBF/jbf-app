"use client";

import { useActionState } from "react";
import type {
  DossierFormState,
  createDossier,
  updateDossier,
} from "@/app/(app)/dossiers/actions";
import {
  STATUT_LABELS,
  STATUT_VALUES,
  TYPE_PROCEDURE_LABELS,
  TYPE_PROCEDURE_VALUES,
} from "@/lib/dossier-labels";

type ClientOption = { id: string; label: string };
type UserOption = { id: string; label: string };

type Defaults = {
  id?: string;
  numeroDossier?: string;
  clientId?: string;
  typeProcedure?: string;
  juridiction?: string;
  associeResponsableId?: string;
  statut?: string;
  description?: string | null;
  montantConvenu?: string | null;
};

export function DossierForm({
  action,
  defaults,
  clients,
  associes,
  submitLabel,
  cancelHref,
  numeroSuggestion,
}: {
  action: typeof createDossier | typeof updateDossier;
  defaults?: Defaults;
  clients: ClientOption[];
  associes: UserOption[];
  submitLabel: string;
  cancelHref: string;
  numeroSuggestion?: string;
}) {
  const [state, formAction, pending] = useActionState<
    DossierFormState | undefined,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Numéro de dossier"
          name="numeroDossier"
          required
          defaultValue={defaults?.numeroDossier ?? numeroSuggestion ?? ""}
          error={state?.fieldErrors?.numeroDossier}
          hint={
            numeroSuggestion && !defaults?.numeroDossier
              ? `Suggéré : ${numeroSuggestion} (modifiable)`
              : undefined
          }
        />

        <Select
          label="Client"
          name="clientId"
          required
          defaultValue={defaults?.clientId ?? ""}
          options={clients.map((c) => ({ value: c.id, label: c.label }))}
          placeholder="— Choisir un client —"
          error={state?.fieldErrors?.clientId}
        />

        <Select
          label="Type de procédure"
          name="typeProcedure"
          required
          defaultValue={defaults?.typeProcedure ?? ""}
          options={TYPE_PROCEDURE_VALUES.map((v) => ({
            value: v,
            label: TYPE_PROCEDURE_LABELS[v],
          }))}
          placeholder="— Choisir un type —"
          error={state?.fieldErrors?.typeProcedure}
        />

        <Field
          label="Juridiction"
          name="juridiction"
          required
          defaultValue={defaults?.juridiction ?? ""}
          error={state?.fieldErrors?.juridiction}
          hint="Ex : TJ Paris, Cour d'appel de Versailles, Cour d'assises Hauts-de-Seine…"
        />

        <Select
          label="Associé responsable"
          name="associeResponsableId"
          required
          defaultValue={defaults?.associeResponsableId ?? ""}
          options={associes.map((a) => ({ value: a.id, label: a.label }))}
          placeholder="— Choisir l'associé —"
          error={state?.fieldErrors?.associeResponsableId}
        />

        <Select
          label="Statut"
          name="statut"
          required
          defaultValue={defaults?.statut ?? "en_cours"}
          options={STATUT_VALUES.map((v) => ({
            value: v,
            label: STATUT_LABELS[v],
          }))}
          error={state?.fieldErrors?.statut}
        />

        <Field
          label="Montant convenu (€)"
          name="montantConvenu"
          type="text"
          inputMode="decimal"
          defaultValue={defaults?.montantConvenu ?? ""}
          error={state?.fieldErrors?.montantConvenu}
          hint="Facultatif. Ex : 5000 ou 5000,50"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-700"
        >
          Description{" "}
          <span className="text-xs text-slate-400">(facultatif)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaults?.description ?? ""}
          placeholder="Contexte du dossier, faits, observations internes…"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        {state?.fieldErrors?.description ? (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.description}
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
  inputMode,
  required = false,
  defaultValue,
  error,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  inputMode?: "decimal" | "numeric" | "text" | "tel";
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
        inputMode={inputMode}
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

function Select({
  label,
  name,
  required = false,
  defaultValue,
  options,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
