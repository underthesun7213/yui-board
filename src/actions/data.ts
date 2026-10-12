import { readAll } from '../api/rest';
import { data, setData } from '../state/data';

export async function loadData() {
  if (data.get().status === 'loading') return;
  data.set({ status: 'loading' });
  try {
    const s = await readAll();
    setData(s.places, s.events, s.overrides, new Date().toISOString());
  } catch {
    data.set({
      status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error',
    });
  }
}
