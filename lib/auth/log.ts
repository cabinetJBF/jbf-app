import "server-only";
import { db } from "@/lib/db";
import { accessLogs } from "@/lib/db/schema";

export type AccessLogAction =
  | "login"
  | "login_failed"
  | "logout";

export async function logAccess(entry: {
  userId: string | null;
  action: AccessLogAction | string;
  ip?: string | null;
  userAgent?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  await db.insert(accessLogs).values({
    userId: entry.userId,
    action: entry.action,
    ip: entry.ip ?? null,
    userAgent: entry.userAgent ?? null,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    details: entry.details ?? null,
  });
}

export function extractClientIp(headers: Headers): string | null {
  const netlifyIp = headers.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;

  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf;

  const real = headers.get("x-real-ip");
  if (real) return real;

  return null;
}
