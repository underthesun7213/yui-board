import { useEffect } from 'react';
import { go } from '../../actions/nav';
import { deleteEvent, deletePlace, refreshMine } from '../../actions/write';
import { formatDay } from '../../domain/calendar/dates';
import { LOCALE, fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { session } from '../../state/session';
import { useStore } from '../../state/useStore';
import { BackBar } from '../../ui/BackBar';

/* What this browser posted, with each item's state (ME-02, Y-R8). */
export function MyItems() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const items = useStore(session, (s) => s.items);
  const failed = useStore(session, (s) => s.itemsError);
  useEffect(() => {
    void refreshMine();
  }, []);
  const day = (d: string) =>
    formatDay(d, LOCALE[lang], { year: 'numeric', month: 'short', day: 'numeric' });
  return (
    <>
      <BackBar title={m.myT} />
      {failed && (
        <p className="dstatus warn" role="alert">
          {m.dataError} <button onClick={() => void refreshMine()}>{m.locRetry}</button>
        </p>
      )}
      {items == null ? (
        <p className="empty">{m.loading}</p>
      ) : !items.length ? (
        <p className="empty">{m.myEmpty}</p>
      ) : (
        <ul className="mylist">
          {items.map((i) => (
            <li key={i.kind + i.id} className={'my ' + i.state}>
              <span className="kind">{i.kind === 'place' ? m.kindPlace : m.kindEvent}</span>
              <b>{i.title}</b>
              <span className="meta">
                {fill(m.addedOn, { d: day(i.created_on) })}
                {i.edited_on && ' · ' + fill(m.editedOn, { d: day(i.edited_on) })}
              </span>
              <span className={'state ' + i.state}>{m.st[i.state]}</span>
              {i.state === 'hidden_review' && <p className="hint">{m.myHiddenHelp}</p>}
              {i.state !== 'deleted' && (
                <div className="btns">
                  <button
                    className="secondary"
                    onClick={() =>
                      i.kind === 'place'
                        ? go({ name: 'placeEdit', id: i.id })
                        : go({ name: 'eventEdit', id: i.id })
                    }
                  >
                    {m.edit}
                  </button>
                  <button
                    className="secondary"
                    onClick={() =>
                      void (i.kind === 'place'
                        ? deletePlace(i.id)
                        : deleteEvent(i.id, { stay: true }))
                    }
                  >
                    {m.del}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
