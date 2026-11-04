import { decodeState, mergeState, newState, validCard } from './learning.js';

const STATE_KEY = 'mind-expansion.state.v1';
const POOL_KEY = 'mind-expansion.pool.v1';

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

export async function openLibrary() {
  const db = await openDatabase();
  db.onversionchange = () => db.close();

  const reader = db.transaction(['records', 'days', 'cache']);
  const completion = done(reader);
  const records = reader.objectStore('records').getAll();
  const dates = reader.objectStore('days').getAllKeys();
  const cards = reader.objectStore('days').getAll();
  const cached = reader.objectStore('cache').get(POOL_KEY);
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
        const prior = request.result;
        if (prior && Date.parse(prior.updatedAt) > Date.parse(record.updatedAt)) {
          updated.records[key] = prior;
          return;
        }
        recordStore.put(record, key);
        updated.records[key] = record;
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
  return {
    initial, pool, write,
    async writePool(value) {
      const transaction = db.transaction('cache', 'readwrite');
      const completion = done(transaction);
      transaction.objectStore('cache').put(value, POOL_KEY);
      await completion;
    },
  };
}
