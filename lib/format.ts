const PARIS_DATE_TIME = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

const PARIS_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Paris",
});

export function formatDateTimeParis(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return PARIS_DATE_TIME.format(d).replace(",", " à");
}

export function formatDateParis(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return PARIS_DATE.format(d);
}
