/* The terms, privacy policy and contact (SYS-04, B-16), from the published
   texts in docs/09-release/legal (Japanese authoritative). They are written in
   a small part of Markdown, read here into blocks of plain text: the screen
   puts every string into the DOM as text, never as HTML. */
import type { Lang } from '../domain/types';

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

/* The usage statistics switch at the top of the screen (D40): words in the
   terms screen's chunk, not the first screen's. */
export const STATS_TEXT: Record<Lang, { statsT: string; statsB: string }> = {
  en: {
    statsT: 'Share anonymous usage statistics',
    statsB:
      'Whether the app is opened or installed and whether the game is played, with a random ID. No name or location, and the IP address is not used. See 5. Analytics below.',
  },
  ja: {
    statsT: '匿名の利用統計を送る',
    statsB:
      'アプリを開いたか・追加したか・ゲームを遊んだかを、ランダムな ID と一緒に送ります。名前や位置は送らず、IP アドレスも使いません。下の「5. アクセス解析」をご覧ください。',
  },
  ko: {
    statsT: '익명 이용 통계 보내기',
    statsB:
      '앱을 열었는지, 설치했는지, 게임을 했는지를 무작위 ID와 함께 보내요. 이름이나 위치는 보내지 않고 IP 주소도 쓰지 않아요. 아래 "5. 방문 통계"를 보세요.',
  },
};
