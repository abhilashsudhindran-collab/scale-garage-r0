// Tiny IndexedDB wrapper for the offline-queue spike. One database, one store.

const DB_NAME = 'sgr0-offline';
const STORE = 'queue';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'clientId' });
        s.createIndex('status', 'status');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result;
    Promise.resolve(fn(store)).then(r => { result = r; });
    t.oncomplete = () => { db.close(); resolve(result); };
    t.onerror = () => { db.close(); reject(t.error); };
    t.onabort = () => { db.close(); reject(t.error || new Error('Transaction aborted')); };
  });
}

const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export const queue = {
  put: (item) => tx('readwrite', s => reqP(s.put(item))),
  get: (id) => tx('readonly', s => reqP(s.get(id))),
  all: () => tx('readonly', s => reqP(s.getAll())),
  remove: (id) => tx('readwrite', s => reqP(s.delete(id))),
  clear: () => tx('readwrite', s => reqP(s.clear())),
};
