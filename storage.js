import { decodeState, mergeRecord, mergeState, newState, validCard } from './learning.js?v=8';

const STATE_KEY = 'mind-expansion.state.v1';
const POOL_KEY = 'mind-expansion.pool.v1';
const CATALOG_KEY = 'mind-expansion.catalog.v1';
const VIEW_PREFIX = 'viewed:';
const LOCAL_VIEWS_KEY = 'mind-expansion.viewed.v1';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mind-expansion', 1);
    request.onupgradeneeded = () => {
      for (const name of ['records', 'days', 'cache']) request.result.createObjectStore(name);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function done(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error || new Error('Library write interrupted'));
    transaction.onerror = () => reject(transaction.error);
  });
}

export function readLocalState() {
  const raw = localStorage.getItem(STATE_KEY);
  return raw ? decodeState(JSON.parse(raw)) : newState();
}

export function writeLocalState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function onLocalChange(event, listener) {
  if (event.key === STATE_KEY) listener(readLocalState());
}

export function readLocalViews() {
  try {
    const ids = JSON.parse(localStorage.getItem(LOCAL_VIEWS_KEY) || '[]');
    return new Set(Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export function writeLocalView(id) {
  const ids = readLocalViews();
  ids.add(id);
  localStorage.setItem(LOCAL_VIEWS_KEY, JSON.stringify([...ids]));
}

export async function openLibrary() {
  const db = await openDatabase();
  db.onversionchange = () => db.close();

  const reader = db.transaction(['records', 'days', 'cache']);
  const completion = done(reader);
  const records = reader.objectStore('records').getAll();
  const dates = reader.objectStore('days').getAllKeys();
  const cards = reader.objectStore('days').getAll();
  const cached = reader.objectStore('cache').get(POOL_KEY);
  const cachedCatalog = reader.objectStore('cache').get(CATALOG_KEY);
  const viewedKeys = reader.objectStore('cache').getAllKeys(IDBKeyRange.bound(VIEW_PREFIX, VIEW_PREFIX + '\uffff'));
  await completion;
  const loaded = newState();
  for (const record of records.result) loaded.records[record.card.id] = record;
  dates.result.forEach((date, index) => { loaded.days[date] = cards.result[index]; });
  let pool = (cached.result || []).filter(validCard);

  async function write(changes) {
    const transaction = db.transaction(['records', 'days'], 'readwrite');
    const completion = done(transaction);
    const updated = newState();
    const recordStore = transaction.objectStore('records');
    const dayStore = transaction.objectStore('days');
    for (const [key, record] of Object.entries(changes.records)) {
      const request = recordStore.get(key);
      request.onsuccess = () => {
        const merged = mergeRecord(request.result, record);
        recordStore.put(merged, key);
        updated.records[key] = merged;
      };
    }
    for (const [date, card] of Object.entries(changes.days)) {
      const request = dayStore.get(date);
      request.onsuccess = () => {
        if (!request.result) dayStore.put(card, date);
        updated.days[date] = request.result || card;
      };
    }
    await completion;
    return updated;
  }

  let initial = loaded;
  try {
    const legacy = readLocalState();
    if (Object.keys(legacy.records).length || Object.keys(legacy.days).length) {
      initial = mergeState(loaded, await write(legacy));
      localStorage.removeItem(STATE_KEY);
    }
    if (!pool.length) pool = JSON.parse(localStorage.getItem(POOL_KEY) || '[]').filter(validCard).slice(0, 120);
  } catch {
    // Browser storage from an earlier session is optional.
  }
  async function writeCache(key, value) {
    const transaction = db.transaction('cache', 'readwrite');
    const completion = done(transaction);
    transaction.objectStore('cache').put(value, key);
    await completion;
  }
  return {
    initial, pool, write, catalog: (cachedCatalog.result || []).filter(validCard),
    viewed: new Set(viewedKeys.result.map(key => key.slice(VIEW_PREFIX.length))),
    writeView: id => writeCache(VIEW_PREFIX + id, true),
    writePool: value => writeCache(POOL_KEY, value),
    writeCatalog: value => writeCache(CATALOG_KEY, value),
  };
}
