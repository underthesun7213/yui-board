import ja from '../../../docs/09-release/legal/ja.md?raw';
import en from '../../../docs/09-release/legal/en.md?raw';
import ko from '../../../docs/09-release/legal/ko.md?raw';
import { CONTACT_EMAIL, parseLegal, type Span } from '../../content/legal';
import type { Lang } from '../../domain/types';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { BackBar } from '../../ui/BackBar';

const TEXTS: Record<Lang, string> = { ja, en, ko };
const parsed: Partial<Record<Lang, ReturnType<typeof parseLegal>>> = {};

const Text = ({ spans }: { spans: Span[] }) =>
  spans.map((s, i) => (s.b ? <b key={i}>{s.text}</b> : s.text));

/* Terms, privacy policy and contact (SYS-04, B-16), in the screen's language;
   the Japanese version is authoritative, as each text says. */
export function Legal() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const blocks = (parsed[lang] ??= parseLegal(TEXTS[lang]));
  return (
    <>
      <BackBar title={m.legalT} />
      <article className="legal" lang={lang}>
        {blocks.map((b, i) => {
          switch (b.t) {
            case 'h1':
              return null; /* the bar above carries the title */
            case 'h2':
              return (
                <h2 key={i}>
                  <Text spans={b.spans} />
                </h2>
              );
            case 'h3':
              return (
                <h3 key={i}>
                  <Text spans={b.spans} />
                </h3>
              );
            case 'p':
              return (
                <p key={i}>
                  <Text spans={b.spans} />
                </p>
              );
            case 'ul':
              return (
                <ul key={i}>
                  {b.items.map((it, j) => (
                    <li key={j}>
                      <Text spans={it} />
                    </li>
                  ))}
                </ul>
              );
            case 'table':
              return (
                <div key={i} className="tablewrap">
                  <table>
                    <thead>
                      <tr>
                        {b.head.map((c, j) => (
                          <th key={j}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {b.rows.map((r, j) => (
                        <tr key={j}>
                          {r.map((c, k) => (
                            <td key={k}>{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            case 'hr':
              return <hr key={i} />;
          }
        })}
        <p className="btns">
          <a className="primary" href={'mailto:' + CONTACT_EMAIL}>
            {m.legalMail}
          </a>
        </p>
      </article>
    </>
  );
}
