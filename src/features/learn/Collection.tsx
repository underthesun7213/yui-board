import { endingKey } from '../../content/art';
import { ENDINGS } from '../../content/endings';
import { plain } from '../../content/ruby';
import { useT } from '../../i18n/useT';
import { collection } from '../../state/collection';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { ArtImage } from '../../ui/ArtImage';
import { BackBar } from '../../ui/BackBar';
import { Ruby } from '../../ui/Ruby';

export function Collection() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const cg = useStore(collection, (s) => s.cg);
  const got = ENDINGS.filter((e) => cg[e.id]).length;
  return (
    <>
      <BackBar title={m.colT} right={`${got} / ${ENDINGS.length}`} />
      <div className="sechead">
        <h1>{m.colT}</h1>
        <p>{m.colS}</p>
      </div>
      {!got && <p className="cempty">{m.colEmpty}</p>}
      <div className="cgrid">
        {ENDINGS.map((e) =>
          cg[e.id] ? (
            <div key={e.id} className="card">
              <ArtImage k={endingKey(e.id)} alt={plain(e.jp)} className="cgart" />
              <b>{e.t[lang]}</b>
              <q lang="ja">
                <Ruby text={e.jp} />
              </q>
              <p>{e.n[lang]}</p>
            </div>
          ) : (
            <div key={e.id} className="card lock">
              <div className="cgart" />
              <b>{m.locked}</b>
            </div>
          ),
        )}
      </div>
    </>
  );
}
