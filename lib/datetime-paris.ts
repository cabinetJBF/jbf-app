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
