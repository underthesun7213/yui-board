/* The terms, privacy policy and contact (SYS-04, B-16), from the published
   texts in docs/09-release/legal (Japanese authoritative). They are written in
   a small part of Markdown, read here into blocks of plain text: the screen
   puts every string into the DOM as text, never as HTML. */

/** A run of text; `b` for the **bold** parts. */
export interface Span {
  text: string;
  b?: boolean;
}

export type Block =
  | { t: 'h1' | 'h2' | 'h3' | 'p'; spans: Span[] }
  | { t: 'ul'; items: Span[][] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'hr' };

export const CONTACT_EMAIL = 'yunabi@juha.dev';

function spans(line: string): Span[] {
  return line
    .split('**')
    .map((text, i) => (i % 2 ? { text, b: true } : { text }))
    .filter((s) => s.text);
}

const cells = (line: string) =>
  line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

/** Headings (#, ##, ###), paragraphs, "- " lists, pipe tables and ---. */
export function parseLegal(md: string): Block[] {
  const out: Block[] = [];
  const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    const h = /^(#{1,3}) (.*)$/.exec(line);
    if (h) {
      out.push({ t: (['h1', 'h2', 'h3'] as const)[h[1]!.length - 1]!, spans: spans(h[2]!) });
    } else if (line === '---') {
      out.push({ t: 'hr' });
    } else if (line.startsWith('- ')) {
      const items: Span[][] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('- '))
        items.push(spans(lines[i++]!.trim().slice(2)));
      i--;
      out.push({ t: 'ul', items });
    } else if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('|'))
        rows.push(cells(lines[i++]!.trim()));
      i--;
      const [head = [], , ...body] = rows; // the second row is the |---| line
      out.push({ t: 'table', head, rows: body });
    } else {
      out.push({ t: 'p', spans: spans(line) });
    }
  }
  return out;
}
