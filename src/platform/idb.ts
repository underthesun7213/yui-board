/* The last data read from the server, kept on the device so the map and the
   calendar open offline (Y-C3). One record, replaced whole on each read, so
   hidden items disappear from it too (Y-R10). Any failure means "no snapshot". */
const DB = 'yui';
const STORE = 'snapshot';

function open(): Promise<IDBDatabase> {
  return new Promise((ok, no) => {
    if (typeof indexedDB === 'undefined') return no(new Error('no indexedDB'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
}

export async function loadSnapshot<T>(): Promise<T | null> {
  try {
    const db = await open();
    return await new Promise<T | null>((ok) => {
      const r = db.transaction(STORE).objectStore(STORE).get('data');
      r.onsuccess = () => ok((r.result as T | undefined) ?? null);
      r.onerror = () => ok(null);
    });
  } catch {
    return null;
  }
}

export async function saveSnapshot(value: unknown): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((ok) => {
      const t = db.transaction(STORE, 'readwrite');
      t.objectStore(STORE).put(value, 'data');
      t.oncomplete = () => ok();
      t.onerror = () => ok();
    });
  } catch {
    /* storage blocked: work from memory */
  }
}
