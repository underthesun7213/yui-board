import { ACH_BET } from '../content/achievements';
import { t } from '../i18n';
import { store } from '../platform/storage';
import { collection } from '../state/collection';
import { prefs } from '../state/prefs';
import { vn } from '../state/vn';
import { toast } from './ui';

/* An achievement illustration: kept on the device with the ending cards. A
   new one is announced and shown in the scene; one already owned passes quietly. */
export function unlock(id: string) {
  const cg = collection.get().cg;
  if (cg[id]) return;
  const next: Record<string, true> = { ...cg, [id]: true };
  collection.set({ cg: next });
  store.set('cg', next);
  vn.set({ got: id });
  toast(t(prefs.get().lang).achGot);
}

/* The smart-ball match is over (a rematch may change the result). Win or
   lose, the bet taken in the scene before unlocks its picture. */
export function endBall(result: 'win' | 'lose') {
  const v = vn.get();
  vn.set({ ball: result });
  if (v.bet) unlock(ACH_BET[v.bet]);
}
