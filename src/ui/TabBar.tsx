import { tab } from '../actions/nav';
import { TAB_OF } from '../app/routes';
import { useT } from '../i18n/useT';
import { route } from '../state/route';
import { useStore } from '../state/useStore';

export function TabBar() {
  const m = useT();
  const cur = useStore(route, (s) => TAB_OF[s.route.name]);
  return (
    <nav className="tabbar" aria-label={m.aTabs}>
      {m.tabs.map((label, i) => (
        <button
          key={i}
          data-t={i}
          aria-pressed={cur === i}
          aria-current={cur === i ? 'page' : undefined}
          onClick={() => tab(i)}
        >
          <i aria-hidden="true">{m.tabIcon[i]}</i>
          {label}
        </button>
      ))}
    </nav>
  );
}
