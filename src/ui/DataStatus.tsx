import { loadData } from '../actions/data';
import { fill, LOCALE } from '../i18n';
import { useT } from '../i18n/useT';
import { data } from '../state/data';
import { prefs } from '../state/prefs';
import { useStore } from '../state/useStore';

/* Shared places and events: say when they are still loading, could not load,
   or are a saved copy shown offline (Y-C3), so an empty list is never
   mistaken for "nothing here". */
export function DataStatus() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const status = useStore(data, (s) => s.status);
  const fetchedAt = useStore(data, (s) => s.fetchedAt);
  if ((status === 'loading' || status === 'idle') && !fetchedAt)
    return (
      <p className="dstatus" role="status">
        {m.loading}
      </p>
    );
  if (status === 'offline' && fetchedAt) {
    const t = new Date(fetchedAt).toLocaleString(LOCALE[lang], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    });
    return (
      <p className="dstatus warn" role="status">
        {fill(m.dataOffline, { t })}
      </p>
    );
  }
  if (status === 'error' || status === 'offline')
    return (
      <p className="dstatus warn" role="alert">
        {m.dataError} <button onClick={() => void loadData()}>{m.locRetry}</button>
      </p>
    );
  return null;
}
