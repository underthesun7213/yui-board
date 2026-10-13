import { useEffect } from 'react';
import { useStore } from '../state/useStore';
import { fill, type AdminLang } from './i18n';
import { ItemDetail } from './ItemDetail';
import { Enroll, Login, PickFactor } from './Login';
import { Accounts, AuditLog, Search, Security } from './Other';
import { Queue } from './Queue';
import { admin, leave, resume, type Tab } from './state';
import { useM, useWhen } from './useM';

const LANGS: [AdminLang, string][] = [
  ['en', 'English'],
  ['ja', '日本語'],
  ['ko', '한국어'],
];

export function AdminApp() {
  const m = useM();
  const when = useWhen();
  const s = useStore(admin, (x) => x);
  useEffect(() => {
    void resume();
  }, []);
  useEffect(() => {
    document.documentElement.lang = s.lang;
    document.title = m.title;
  }, [s.lang, m.title]);
  return (
    <>
      <header className="top">
        <h1>{m.title}</h1>
        <label className="lang">
          <span className="sr">{m.lang}</span>
          <select
            name="lang"
            value={s.lang}
            onChange={(e) => admin.set({ lang: e.target.value as AdminLang })}
          >
            {LANGS.map(([l, n]) => (
              <option key={l} value={l} lang={l}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {s.phase === 'ready' && (
          <div className="who">
            <span data-email="">{s.email}</span>
            {s.until && <span className="muted">{fill(m.sessionUntil, { t: when(s.until) })}</span>}
            <button className="secondary" onClick={() => void leave()}>
              {m.signOut}
            </button>
          </div>
        )}
      </header>
      <main>
        {s.phase === 'boot' && <p className="muted">{m.loading}</p>}
        {s.phase === 'login' && <Login key={String(s.forbidden)} />}
        {s.phase === 'pick' && <PickFactor />}
        {s.phase === 'enroll' && <Enroll />}
        {s.phase === 'ready' && <Ready tab={s.tab} />}
      </main>
    </>
  );
}

function Ready({ tab }: { tab: Tab }) {
  const m = useM();
  const item = useStore(admin, (s) => s.item);
  const few = useStore(admin, (s) => s.factorCount < 2);
  return (
    <>
      {few && (
        <p className="warn" role="status">
          {m.oneFactorWarn}
        </p>
      )}
      <nav className="tabs">
        {(Object.keys(m.tabs) as Tab[]).map((t) => (
          <button
            key={t}
            data-tab={t}
            aria-pressed={tab === t && !item}
            onClick={() => admin.set({ tab: t, item: null })}
          >
            {m.tabs[t]}
          </button>
        ))}
      </nav>
      {item ? (
        <ItemDetail key={`${item.kind}:${item.id}`} at={item} />
      ) : tab === 'queue' ? (
        <Queue />
      ) : tab === 'accounts' ? (
        <Accounts />
      ) : tab === 'search' ? (
        <Search />
      ) : tab === 'log' ? (
        <AuditLog />
      ) : (
        <Security />
      )}
    </>
  );
}
