import { Resend } from "resend";

let cachedResend: Resend | null = null;

export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY n'est pas défini");
  }
  if (!cachedResend) {
    cachedResend = new Resend(process.env.RESEND_API_KEY);
  }
  return cachedResend;
}

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Cabinet JBF <onboarding@resend.dev>";

export const SITE_URL =
  process.env.SITE_URL ?? "https://cabinet-jbf.netlify.app";

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(params: SendEmailParams): Promise<{
  id: string | null;
  error: string | null;
}> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[email] RESEND_API_KEY absent — email non envoyé (dry-run) :",
      params.subject,
    );
    return { id: null, error: "RESEND_API_KEY absent" };
  }

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    if (result.error) {
      console.error("[email] Erreur Resend :", result.error);
      return { id: null, error: result.error.message };
    }
    return { id: result.data?.id ?? null, error: null };
  } catch (err) {
    console.error("[email] Exception :", err);
    return {
      id: null,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
