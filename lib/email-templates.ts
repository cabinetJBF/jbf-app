import { formatAudienceDateParis, formatEcheanceLong } from "@/lib/datetime-paris";
import { SITE_URL } from "@/lib/email";

type AudienceWindow = "J-7" | "J-3" | "J-0";
type RappelWindow = "J-3" | "J-0";

const WINDOW_AUDIENCE_LABEL: Record<AudienceWindow, string> = {
  "J-7": "dans 7 jours",
  "J-3": "dans 3 jours",
  "J-0": "demain",
};

const WINDOW_RAPPEL_LABEL: Record<RappelWindow, string> = {
  "J-3": "dans 3 jours",
  "J-0": "aujourd'hui",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  ${bodyHtml}
  <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
    Cet email est envoyé automatiquement par Cabinet JBF — outil interne. Ne pas répondre.
  </p>
</body>
</html>`;
}

export type AudienceEmailInput = {
  window: AudienceWindow;
  dossierIntitule: string | null;
  dossierNumero: string;
  dossierId: string;
  clientNomComplet: string;
  juridiction: string;
  dateHeureUtc: string;
};

export function renderAudienceEmail(input: AudienceEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const intituleStr = input.dossierIntitule ?? "(sans intitulé)";
  const when = WINDOW_AUDIENCE_LABEL[input.window];
  const dateFormatted = formatAudienceDateParis(input.dateHeureUtc);
  const dossierUrl = `${SITE_URL}/dossiers/${input.dossierId}`;

  const subject =
    input.window === "J-0"
      ? `[Cabinet JBF] Audience demain — ${intituleStr}`
      : `[Cabinet JBF] Audience ${when} — ${intituleStr}`;

  const text = `Rappel d'audience ${when}

Dossier : ${intituleStr} (${input.dossierNumero})
Client : ${input.clientNomComplet}
Juridiction : ${input.juridiction}
Date : ${dateFormatted}

Lien vers le dossier : ${dossierUrl}
`;

  const html = htmlShell(`
    <h2 style="margin: 0 0 12px; color: #b45309;">Rappel d'audience ${escapeHtml(when)}</h2>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td style="padding: 4px 8px 4px 0; color: #64748b; vertical-align: top;">Dossier</td>
          <td style="padding: 4px 0; font-weight: 500;">${escapeHtml(intituleStr)} <span style="color: #64748b; font-family: monospace;">(${escapeHtml(input.dossierNumero)})</span></td></tr>
      <tr><td style="padding: 4px 8px 4px 0; color: #64748b; vertical-align: top;">Client</td>
          <td style="padding: 4px 0;">${escapeHtml(input.clientNomComplet)}</td></tr>
      <tr><td style="padding: 4px 8px 4px 0; color: #64748b; vertical-align: top;">Juridiction</td>
          <td style="padding: 4px 0;">${escapeHtml(input.juridiction)}</td></tr>
      <tr><td style="padding: 4px 8px 4px 0; color: #64748b; vertical-align: top;">Date</td>
          <td style="padding: 4px 0;"><strong>${escapeHtml(dateFormatted)}</strong></td></tr>
    </table>
    <p style="margin-top: 16px;">
      <a href="${dossierUrl}" style="display: inline-block; background: #0f172a; color: white; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-weight: 500;">Ouvrir le dossier</a>
    </p>
  `);

  return { subject, text, html };
}

export type RappelEmailInput = {
  window: RappelWindow;
  rappelTitre: string;
  dateEcheance: string;
  dossierIntitule: string | null;
  dossierNumero: string;
  dossierId: string;
};

export function renderRappelEmail(input: RappelEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const intituleStr = input.dossierIntitule ?? "(sans intitulé)";
  const when = WINDOW_RAPPEL_LABEL[input.window];
  const echeanceFormatted = formatEcheanceLong(input.dateEcheance);
  const dossierUrl = `${SITE_URL}/dossiers/${input.dossierId}/rappels`;

  const subject =
    input.window === "J-0"
      ? `[Cabinet JBF] À faire aujourd'hui — ${input.rappelTitre}`
      : `[Cabinet JBF] Rappel ${when} — ${input.rappelTitre}`;

  const text = `Rappel à faire ${when}

${input.rappelTitre}

Dossier : ${intituleStr} (${input.dossierNumero})
Échéance : ${echeanceFormatted}

Lien vers les rappels du dossier : ${dossierUrl}
`;

  const html = htmlShell(`
    <h2 style="margin: 0 0 12px; color: #0369a1;">Rappel à faire ${escapeHtml(when)}</h2>
    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 500;">${escapeHtml(input.rappelTitre)}</p>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td style="padding: 4px 8px 4px 0; color: #64748b; vertical-align: top;">Dossier</td>
          <td style="padding: 4px 0;">${escapeHtml(intituleStr)} <span style="color: #64748b; font-family: monospace;">(${escapeHtml(input.dossierNumero)})</span></td></tr>
      <tr><td style="padding: 4px 8px 4px 0; color: #64748b; vertical-align: top;">Échéance</td>
          <td style="padding: 4px 0;"><strong>${escapeHtml(echeanceFormatted)}</strong></td></tr>
    </table>
    <p style="margin-top: 16px;">
      <a href="${dossierUrl}" style="display: inline-block; background: #0f172a; color: white; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-weight: 500;">Ouvrir les rappels du dossier</a>
    </p>
  `);

  return { subject, text, html };
}
