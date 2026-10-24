import { useT } from '../i18n/useT';
import { ui } from '../state/ui';
import { useStore } from '../state/useStore';
import { activateUpdate } from '../actions/update';

export function Toast() {
  const m = useT();
  const msg = useStore(ui, (s) => s.toast);
  const update = useStore(ui, (s) => s.updateReady);
  return (
    <>
      <div className={'toast' + (msg ? ' on' : '')} role="status" aria-live="polite">
        {msg}
      </div>
      {update && (
        <div className="toast on update" role="status">
          {m.updateReady}
          <button onClick={activateUpdate}>{m.reopen}</button>
        </div>
      )}
    </>
  );
}
