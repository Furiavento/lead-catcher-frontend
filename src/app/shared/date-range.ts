/** Formats a Date as local ISO with offset, e.g. 2026-09-30T00:00:00.000-05:00. */
export function toLocalIso(date: Date): string {
  const pad = (n: number, width = 2) => String(Math.abs(n)).padStart(width, '0');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}` +
    `${sign}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`
  );
}

/** Start of the local day, as the API expects for `from`. */
export function startOfDayIso(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return toLocalIso(d);
}

/** End of the local day, as the API expects for `to`. */
export function endOfDayIso(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return toLocalIso(d);
}

/** YYYY-MM-DD in local time, for URLs. */
export function toDateParam(date: Date): string {
  return toLocalIso(date).slice(0, 10);
}

/** Parses a YYYY-MM-DD param as a local date. */
export function fromDateParam(value: string | null | undefined): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysAgo(days: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d;
}

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
