import { useEffect, useId, useRef, useState } from 'react';
import { closeReport } from '../../actions/report';
import type { ReportReason } from '../../actions/write';
import { useT } from '../../i18n/useT';
import { net } from '../../state/net';
import { session } from '../../state/session';
import { ui } from '../../state/ui';
import { useStore } from '../../state/useStore';
import { Captcha } from '../../ui/Captcha';
import { WriteBlocked } from '../../ui/Field';

const REASONS: ReportReason[] = ['wrong', 'spam', 'inappropriate', 'privacy', 'other'];

/* SYS-03: why is this wrong? One tap per reason, then send. Closed by its
   buttons, Escape, a tap outside, or system back (it is a history step). */
export function ReportSheet() {
  const target = useStore(ui, (s) => s.report);
  if (!target) return null;
  /* a fresh sheet for each item, so a choice never carries over */
  return <Sheet key={`${target.kind}:${target.id}`} kind={target.kind} id={target.id} />;
}

function Sheet({ kind, id }: { kind: 'place' | 'event'; id: number }) {
  const m = useT();
  const online = useStore(net, (s) => s.online);
  const framed = useStore(session, (s) => s.framed);
  const waitCaptcha = useStore(session, (s) => s.captchaRequired && !s.captchaReady);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = useId();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeReport();
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);
  const send = async () => {
    if (!reason || busy) return;
    setBusy(true);
    setError(null);
    const w = await import('../../actions/write');
    const r = await w.report(kind, id, reason);
    setBusy(false);
    if (r.status === 'ok') closeReport();
    else setError(w.explain(r));
  };
  return (
    <div className="sheetbg" onClick={(e) => e.target === e.currentTarget && closeReport()}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title}
        tabIndex={-1}
        ref={box}
        data-report={kind}
      >
        <h2 id={title}>{kind === 'place' ? m.reportPlaceT : m.reportEventT}</h2>
        <fieldset className="reasons">
          <legend>{m.reportWhy}</legend>
          {REASONS.map((r) => (
            <label key={r} className={'reason' + (reason === r ? ' on' : '')}>
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
              />
              {m.reasons[r]}
            </label>
          ))}
        </fieldset>
        <p className="note">{m.reportNote}</p>
        <WriteBlocked online={online} framed={framed} />
        <Captcha />
        {error && (
          <p className="err" role="alert">
            {error}
          </p>
        )}
        <div className="btns">
          <button
            className="primary"
            data-report-send=""
            disabled={!reason || busy || !online || framed || waitCaptcha}
            onClick={() => void send()}
          >
            {busy ? m.reportSending : m.reportSend}
          </button>
          <button className="secondary" onClick={closeReport}>
            {m.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
