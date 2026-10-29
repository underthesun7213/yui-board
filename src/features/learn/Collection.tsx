import { achievementKey, endingKey } from '../../content/art';
import { ACHIEVEMENTS } from '../../content/achievements';
import { ENDINGS } from '../../content/endings';
import { plain } from '../../content/ruby';
import type { L3 } from '../../content/types';
import { useT } from '../../i18n/useT';
import { collection } from '../../state/collection';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { ArtImage } from '../../ui/ArtImage';
import { BackBar } from '../../ui/BackBar';
import { Ruby } from '../../ui/Ruby';

interface Card {
  id: string;
  t: L3;
  jp: string;
  n: L3;
}

/* Achievement illustrations (unlocked during episode 8) and ending cards,
   both kept on the device in yui.v1.cg. */
export function Collection() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const cg = useStore(collection, (s) => s.cg);
  const all = [...ACHIEVEMENTS, ...ENDINGS];
  const got = all.filter((e) => cg[e.id]).length;
  const grid = (cards: Card[], key: (id: string) => string) => (
    <div className="cgrid">
      {cards.map((e) =>
        cg[e.id] ? (
          <div key={e.id} className="card">
            <ArtImage k={key(e.id)} alt={plain(e.jp)} className="cgart" />
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
  );
  return (
    <>
      <BackBar title={m.colT} right={`${got} / ${all.length}`} />
      <div className="sechead">
        <h1>{m.colT}</h1>
        <p>{m.colS}</p>
      </div>
      {!got && <p className="cempty">{m.colEmpty}</p>}
      <h2 className="colh">{m.achH}</h2>
      {grid(ACHIEVEMENTS, achievementKey)}
      <h2 className="colh">{m.endH}</h2>
      {grid(ENDINGS, endingKey)}
    </>
  );
}
