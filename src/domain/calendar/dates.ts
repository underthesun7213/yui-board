/* Dates are YYYY-MM-DD strings in Japan time. Arithmetic goes through UTC so
   the device's own time zone and DST never shift a day. */
export const d2 = (n: number) => String(n).padStart(2, '0');

export function tokyoToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** The time of day in Japan, HH:MM. */
export function tokyoTime(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
}

const ms = (k: string) => Date.parse(k + 'T00:00:00Z');
export const addDays = (k: string, n: number) =>
  new Date(ms(k) + n * 864e5).toISOString().slice(0, 10);
export const dayDiff = (a: string, b: string) => Math.round((ms(b) - ms(a)) / 864e5);
/** 0 = Sunday */
export const weekday = (k: string) => new Date(ms(k)).getUTCDay();

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const t = y * 12 + (m - 1) + n;
  return Math.floor(t / 12) + '-' + d2((t % 12) + 1);
}

/** Cells of a month grid starting on Sunday; null pads the first and last week. */
export function monthCells(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const first = month + '-01';
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array<null>(weekday(first)).fill(null);
  for (let d = 1; d <= dim; d++) cells.push(month + '-' + d2(d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** Date-only values formatted without the device time zone getting a say. */
export function formatDay(k: string, locale: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(ms(k)).toLocaleDateString(locale, { ...opts, timeZone: 'UTC' });
}
