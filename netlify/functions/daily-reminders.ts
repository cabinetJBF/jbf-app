import type { Config } from "@netlify/functions";
import { and, eq, gte, isNull, lt } from "drizzle-orm";
import { db } from "../../lib/db";
import {
  audiences,
  clients,
  dossiers,
  emailLog,
  rappels,
  users,
} from "../../lib/db/schema";
import { sendEmail } from "../../lib/email";
import {
  renderAudienceEmail,
  renderRappelEmail,
} from "../../lib/email-templates";
import {
  formatParisYmd,
  getTodayParisIsoDate,
  parisInputToUtc,
} from "../../lib/datetime-paris";

type AudienceWindow = "J-7" | "J-3" | "J-0";
type RappelWindow = "J-3" | "J-0";

type AudienceEmailType =
  | "audience_J-7"
  | "audience_J-3"
  | "audience_J-0";

type RappelEmailType = "rappel_J-3" | "rappel_J-0";

function addParisDays(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + delta);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function parisDayBoundsUtc(isoDate: string): { startUtc: Date; endUtc: Date } {
  const startUtc = parisInputToUtc(`${isoDate}T00:00:00`);
  const nextDay = addParisDays(isoDate, 1);
  const endUtc = parisInputToUtc(`${nextDay}T00:00:00`);
  return { startUtc, endUtc };
}

const AUDIENCE_WINDOWS: { window: AudienceWindow; delta: number; type: AudienceEmailType }[] = [
  { window: "J-7", delta: 7, type: "audience_J-7" },
  { window: "J-3", delta: 3, type: "audience_J-3" },
  { window: "J-0", delta: 1, type: "audience_J-0" },
];

const RAPPEL_WINDOWS: { window: RappelWindow; delta: number; type: RappelEmailType }[] = [
  { window: "J-3", delta: 3, type: "rappel_J-3" },
  { window: "J-0", delta: 0, type: "rappel_J-0" },
];

type DryRunResult = {
  ok: boolean;
  todayParis: string;
  audiences: Array<{
    window: AudienceWindow;
    dossierIntitule: string | null;
    dossierNumero: string;
    to: string;
    status: "sent" | "already_sent" | "no_recipient" | "send_failed";
    sendError?: string;
  }>;
  rappels: Array<{
    window: RappelWindow;
    titre: string;
    dossierIntitule: string | null;
    dossierNumero: string;
    to: string[];
    status: "sent" | "already_sent" | "no_recipient" | "send_failed";
    sendError?: string;
  }>;
};

async function runDailyReminders(): Promise<DryRunResult> {
  const todayIso = getTodayParisIsoDate();
  const notificationOverride = process.env.NOTIFICATION_EMAIL?.trim() || null;
  const result: DryRunResult = {
    ok: true,
    todayParis: todayIso,
    audiences: [],
    rappels: [],
  };

  // --- Audiences ---
  for (const w of AUDIENCE_WINDOWS) {
    const targetIso = addParisDays(todayIso, w.delta);
    const { startUtc, endUtc } = parisDayBoundsUtc(targetIso);

    const rows = await db
      .select({
        audienceId: audiences.id,
        dateHeure: audiences.dateHeure,
        dossierId: dossiers.id,
        dossierIntitule: dossiers.intitule,
        dossierNumero: dossiers.numeroDossier,
        juridiction: dossiers.juridiction,
        clientNom: clients.nom,
        clientPrenom: clients.prenom,
        associeEmail: users.email,
      })
      .from(audiences)
      .innerJoin(dossiers, eq(audiences.dossierId, dossiers.id))
      .innerJoin(clients, eq(dossiers.clientId, clients.id))
      .innerJoin(users, eq(dossiers.associeResponsableId, users.id))
      .where(
        and(
          gte(audiences.dateHeure, startUtc),
          lt(audiences.dateHeure, endUtc),
          isNull(dossiers.archiveLe),
          eq(users.actif, true),
        ),
      );

    for (const row of rows) {
      const existingLog = await db
        .select({ id: emailLog.id })
        .from(emailLog)
        .where(
          and(
            eq(emailLog.audienceId, row.audienceId),
            eq(emailLog.emailType, w.type),
          ),
        )
        .limit(1);

      if (existingLog.length > 0) {
        result.audiences.push({
          window: w.window,
          dossierIntitule: row.dossierIntitule,
          dossierNumero: row.dossierNumero,
          to: row.associeEmail,
          status: "already_sent",
        });
        continue;
      }

      const utc =
        typeof row.dateHeure === "string"
          ? row.dateHeure
          : row.dateHeure.toISOString();

      const { subject, text, html } = renderAudienceEmail({
        window: w.window,
        dossierIntitule: row.dossierIntitule,
        dossierNumero: row.dossierNumero,
        dossierId: row.dossierId,
        clientNomComplet: `${row.clientNom.toUpperCase()} ${row.clientPrenom}`,
        juridiction: row.juridiction,
        dateHeureUtc: utc,
      });

      const audienceRecipient = notificationOverride ?? row.associeEmail;
      const sendResult = await sendEmail({
        to: audienceRecipient,
        subject,
        text,
        html,
      });

      if (sendResult.error) {
        result.audiences.push({
          window: w.window,
          dossierIntitule: row.dossierIntitule,
          dossierNumero: row.dossierNumero,
          to: audienceRecipient,
          status: "send_failed",
          sendError: sendResult.error,
        });
        result.ok = false;
        continue;
      }

      await db.insert(emailLog).values({
        emailType: w.type,
        audienceId: row.audienceId,
        destinataire: audienceRecipient,
      });

      result.audiences.push({
        window: w.window,
        dossierIntitule: row.dossierIntitule,
        dossierNumero: row.dossierNumero,
        to: audienceRecipient,
        status: "sent",
      });
    }
  }

  // --- Rappels ---
  let cabinetEmails: string[];
  if (notificationOverride) {
    cabinetEmails = [notificationOverride];
  } else {
    const activeAssociates = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.actif, true));
    cabinetEmails = activeAssociates.map((u) => u.email);
  }

  for (const w of RAPPEL_WINDOWS) {
    const targetIso = addParisDays(todayIso, w.delta);

    const rows = await db
      .select({
        rappelId: rappels.id,
        titre: rappels.titre,
        dateEcheance: rappels.dateEcheance,
        termine: rappels.termine,
        dossierId: dossiers.id,
        dossierIntitule: dossiers.intitule,
        dossierNumero: dossiers.numeroDossier,
      })
      .from(rappels)
      .innerJoin(dossiers, eq(rappels.dossierId, dossiers.id))
      .where(
        and(
          eq(rappels.dateEcheance, targetIso),
          eq(rappels.termine, false),
          isNull(dossiers.archiveLe),
        ),
      );

    for (const row of rows) {
      const existingLog = await db
        .select({ id: emailLog.id })
        .from(emailLog)
        .where(
          and(
            eq(emailLog.rappelId, row.rappelId),
            eq(emailLog.emailType, w.type),
          ),
        )
        .limit(1);

      if (existingLog.length > 0) {
        result.rappels.push({
          window: w.window,
          titre: row.titre,
          dossierIntitule: row.dossierIntitule,
          dossierNumero: row.dossierNumero,
          to: cabinetEmails,
          status: "already_sent",
        });
        continue;
      }

      if (cabinetEmails.length === 0) {
        result.rappels.push({
          window: w.window,
          titre: row.titre,
          dossierIntitule: row.dossierIntitule,
          dossierNumero: row.dossierNumero,
          to: [],
          status: "no_recipient",
        });
        continue;
      }

      const { subject, text, html } = renderRappelEmail({
        window: w.window,
        rappelTitre: row.titre,
        dateEcheance: row.dateEcheance,
        dossierIntitule: row.dossierIntitule,
        dossierNumero: row.dossierNumero,
        dossierId: row.dossierId,
      });

      const sendResult = await sendEmail({
        to: cabinetEmails,
        subject,
        text,
        html,
      });

      if (sendResult.error) {
        result.rappels.push({
          window: w.window,
          titre: row.titre,
          dossierIntitule: row.dossierIntitule,
          dossierNumero: row.dossierNumero,
          to: cabinetEmails,
          status: "send_failed",
          sendError: sendResult.error,
        });
        result.ok = false;
        continue;
      }

      await db.insert(emailLog).values({
        emailType: w.type,
        rappelId: row.rappelId,
        destinataire: cabinetEmails.join(","),
      });

      result.rappels.push({
        window: w.window,
        titre: row.titre,
        dossierIntitule: row.dossierIntitule,
        dossierNumero: row.dossierNumero,
        to: cabinetEmails,
        status: "sent",
      });
    }
  }

  return result;
}

export default async function handler(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const headerSecret = req.headers.get("x-cron-secret");
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");
    if (headerSecret !== secret && querySecret !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const result = await runDailyReminders();
    console.log(
      `[daily-reminders] ${result.todayParis} — audiences ${result.audiences.length}, rappels ${result.rappels.length}`,
    );
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("[daily-reminders] Erreur :", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

export const config: Config = {
  schedule: "0 6 * * *",
};
