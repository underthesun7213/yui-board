import { loadData } from '../actions/data';
import { useT } from '../i18n/useT';
import { data } from '../state/data';
import { useStore } from '../state/useStore';

/* Shared places and events: say when they are still loading or could not
   load, so an empty list is never mistaken for "nothing here". */
export function DataStatus() {
  const m = useT();
  const status = useStore(data, (s) => s.status);
  if (status === 'loading' || status === 'idle')
    return (
      <p className="dstatus" role="status">
        {m.loading}
      </p>
    );
  if (status === 'error' || status === 'offline')
    return (
      <p className="dstatus warn" role="alert">
        {m.dataError} <button onClick={() => void loadData()}>{m.locRetry}</button>
      </p>
    );
  return null;
}
