import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { fr } from "date-fns/locale";

const TZ = "Europe/Paris";

export function parisInputToUtc(value: string): Date {
  return fromZonedTime(value, TZ);
}

export function utcToParisInputValue(date: Date | string): string {
  return formatInTimeZone(date, TZ, "yyyy-MM-dd'T'HH:mm");
}

export function formatAudienceDateParis(date: Date | string): string {
  return formatInTimeZone(date, TZ, "EEEE d MMMM yyyy 'à' HH:mm", {
    locale: fr,
  });
}

export function getTodayParisIsoDate(): string {
  return formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
}

export function formatEcheanceLong(isoDate: string): string {
  const [yyyy, mm, dd] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  return formatInTimeZone(date, TZ, "EEEE d MMMM yyyy", { locale: fr });
}

export function getCurrentParisMonth(): { year: number; month: number } {
  const now = new Date();
  const yyyy = Number(formatInTimeZone(now, TZ, "yyyy"));
  const mm = Number(formatInTimeZone(now, TZ, "MM"));
  return { year: yyyy, month: mm };
}

export function parisMonthBoundsUtc(year: number, month: number): {
  startUtc: Date;
  endUtc: Date;
} {
  const monthStr = String(month).padStart(2, "0");
  const startUtc = fromZonedTime(`${year}-${monthStr}-01T00:00:00`, TZ);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStr = String(nextMonth).padStart(2, "0");
  const endUtc = fromZonedTime(`${nextYear}-${nextMonthStr}-01T00:00:00`, TZ);
  return { startUtc, endUtc };
}

export function formatParisMonthLabel(year: number, month: number): string {
  const monthStr = String(month).padStart(2, "0");
  const date = fromZonedTime(`${year}-${monthStr}-01T12:00:00`, TZ);
  return formatInTimeZone(date, TZ, "MMMM yyyy", { locale: fr });
}

export function formatParisYmd(date: Date | string): string {
  return formatInTimeZone(date, TZ, "yyyy-MM-dd");
}

export function formatParisHm(date: Date | string): string {
  return formatInTimeZone(date, TZ, "HH:mm");
}
