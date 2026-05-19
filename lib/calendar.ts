export type CalendarDay = {
  iso: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export function buildCalendarGrid(
  year: number,
  month: number,
  todayIso: string,
): CalendarDay[] {
  const days: CalendarDay[] = [];

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7;
  const lastOfMonth = new Date(Date.UTC(year, month, 0));
  const lastWeekday = (lastOfMonth.getUTCDay() + 6) % 7;

  const startDayShift = firstWeekday;
  const start = new Date(firstOfMonth);
  start.setUTCDate(firstOfMonth.getUTCDate() - startDayShift);

  const trailingDays = 6 - lastWeekday;
  const totalDaysFromMonth = lastOfMonth.getUTCDate();
  const totalCells = startDayShift + totalDaysFromMonth + trailingDays;
  const totalRows = Math.max(5, Math.ceil(totalCells / 7));
  const totalCellsToRender = totalRows * 7;

  for (let i = 0; i < totalCellsToRender; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const iso = `${yyyy}-${mm}-${dd}`;
    days.push({
      iso,
      dayNum: d.getUTCDate(),
      isCurrentMonth: d.getUTCMonth() === month - 1,
      isToday: iso === todayIso,
    });
  }

  return days;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  let m = month - 1 + delta;
  let y = year;
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  while (m > 11) {
    m -= 12;
    y += 1;
  }
  return { year: y, month: m + 1 };
}
