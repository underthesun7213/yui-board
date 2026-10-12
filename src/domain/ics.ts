import type { Occurrence } from './types';

/* RFC 5545: escape text, fold lines at 75 octets, and carry the time zone. */
export const icsEsc = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function icsFold(line: string): string {
  const enc = new TextEncoder();
  let out = '';
  let cur = '';
  let lim = 75;
  for (const ch of line) {
    if (enc.encode(cur + ch).length > lim) {
      out += cur + '\r\n ';
      cur = '';
      lim = 74;
    }
    cur += ch;
  }
  return out + cur;
}

export function buildIcs(o: Occurrence, now: Date = new Date()): string {
  const dt = (k: string, h: string) => k.replace(/-/g, '') + 'T' + h.replace(':', '') + '00';
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  return (
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YUNABI//EN',
      'BEGIN:VTIMEZONE',
      'TZID:Asia/Tokyo',
      'BEGIN:STANDARD',
      'DTSTART:19700101T000000',
      'TZOFFSETFROM:+0900',
      'TZOFFSETTO:+0900',
      'TZNAME:JST',
      'END:STANDARD',
      'END:VTIMEZONE',
      'BEGIN:VEVENT',
      `UID:${o.event.id}-${o.date}@yunabi`,
      'DTSTAMP:' + stamp,
      'DTSTART;TZID=Asia/Tokyo:' + dt(o.date, o.start),
      'DTEND;TZID=Asia/Tokyo:' + dt(o.date, o.end),
      'SUMMARY:' + icsEsc(o.title),
      'LOCATION:' + icsEsc(o.place),
      'DESCRIPTION:' + icsEsc(o.body),
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .map(icsFold)
      .join('\r\n') + '\r\n'
  );
}

export const icsName = (o: Occurrence) => `yunabi-${o.event.id}-${o.date}.ics`;
