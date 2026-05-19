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
