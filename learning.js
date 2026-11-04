export const VERSION = 1;
export const INTERVALS = [1, 3, 7, 14, 30, 60, 120];
export const TOPICS = {
  mind: 'Mind & behavior',
  thinking: 'Clear thinking',
  systems: 'Systems & society',
  science: 'Science & nature',
  practice: 'Learning & practice',
  animals: 'Animal behavior',
  culture: 'Society & culture',
  mysteries: 'Strange & unresolved',
};

export function dayKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function addDays(day, amount) {
  const date = new Date(day + 'T12:00:00');
  date.setDate(date.getDate() + amount);
  return dayKey(date);
}

export function dayNumber(day) {
  return Math.floor(Date.parse(day + 'T00:00:00Z') / 86_400_000);
}

export function reviewDate(day) {
  return new Date(day + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  });
}

export function newState() {
  return { version: VERSION, records: {}, days: {} };
}

export function newRecord(card) {
  return {
    card, saved: false, learned: null, due: null, step: 0, reviews: 0,
    note: '', updatedAt: '',
  };
}

export function learn(record, day, now = new Date().toISOString()) {
  if (record.learned) return record;
  return { ...record, learned: day, due: addDays(day, 1), updatedAt: now };
}

export function rate(record, outcome, day, now = new Date().toISOString()) {
  const step = outcome === 'got-it' ? Math.min(record.step + 1, INTERVALS.length - 1) : 0;
  return {
    ...record,
    learned: record.learned || day,
    step,
    due: addDays(day, INTERVALS[step]),
    reviews: record.reviews + 1,
    updatedAt: now,
  };
}

export function dueRecords(state, day) {
  return Object.values(state.records)
    .filter(record => record.learned && record.due && record.due <= day)
    .sort((a, b) => a.due.localeCompare(b.due) || a.card.title.localeCompare(b.card.title));
}

export function seenCards(state, omitDay = '') {
  const cards = Object.values(state.records).map(record => record.card);
  for (const [day, card] of Object.entries(state.days)) {
    if (day !== omitDay) cards.push(card);
  }
  return new Set(cards.flatMap(card => [card.id, normalize(card.title)]));
}

export function normalize(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function matches(record, query) {
  const { card } = record;
  const haystack = normalize([
    card.title, card.kicker, TOPICS[card.topic], card.intro, card.example, card.prompt,
    card.answer, card.context, card.source.title, card.source.byline, card.tags.join(' '), record.note,
    ...(card.related || []).flatMap(source => [source.title, source.byline]),
  ].join(' '));
  return normalize(query).split(' ').every(term => haystack.includes(term));
}

function validDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const parsed = Date.parse(day + 'T00:00:00Z');
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === day;
}

const stringWithin = (value, limit) => typeof value === 'string' && value.length <= limit;
const nonempty = (value, limit) => stringWithin(value, limit) && value.trim().length > 0;
const safeId = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,119}$/.test(value);

function httpsUrl(value) {
  if (!nonempty(value, 1400)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function validSource(source) {
  return !!source && httpsUrl(source.url) && nonempty(source.title, 240) && stringWithin(source.byline, 240);
}

export function validCard(card) {
  return !!card && safeId(card.id) && Object.hasOwn(TOPICS, card.topic)
    && nonempty(card.title, 160) && stringWithin(card.kicker, 180)
    && nonempty(card.intro, 1800) && stringWithin(card.example, 1200)
    && nonempty(card.prompt, 600) && nonempty(card.answer, 1800)
    && Array.isArray(card.tags) && card.tags.length <= 30
    && card.tags.every(tag => nonempty(tag, 160))
    && ['book', 'research', 'essay', 'encyclopedia'].includes(card.kind)
    && validSource(card.source)
    && (card.context === undefined || stringWithin(card.context, 1200))
    && (card.related === undefined || (Array.isArray(card.related)
      && card.related.length <= 5 && card.related.every(validSource)));
}

export function decodeState(value) {
  if (!value || value.version !== VERSION || !value.records || !value.days
    || Array.isArray(value.records) || Array.isArray(value.days)
    || typeof value.records !== 'object' || typeof value.days !== 'object') {
    throw new Error('Choose a Mind Expansion backup file.');
  }
  const state = newState();
  for (const [id, record] of Object.entries(value.records)) {
    if (!validCard(record?.card) || id !== record.card.id || typeof record.saved !== 'boolean'
      || !(record.learned === null || validDay(record.learned))
      || (record.learned ? !validDay(record.due) : record.due !== null)
      || !Number.isInteger(record.step) || record.step < 0 || record.step >= INTERVALS.length
      || !Number.isSafeInteger(record.reviews) || record.reviews < 0
      || !stringWithin(record.note, 3000) || !nonempty(record.updatedAt, 40)
      || !Number.isFinite(Date.parse(record.updatedAt))) {
      throw new Error('This backup contains a record the app can’t read.');
    }
    state.records[id] = record;
  }
  for (const [day, card] of Object.entries(value.days)) {
    if (!validDay(day) || !validCard(card)) {
      throw new Error('This backup contains an invalid daily idea.');
    }
    state.days[day] = card;
  }
  return state;
}

export function mergeState(current, incoming) {
  const records = { ...current.records };
  for (const [id, record] of Object.entries(incoming.records)) {
    const prior = records[id];
    if (!prior || Date.parse(record.updatedAt) > Date.parse(prior.updatedAt)) records[id] = record;
  }
  return { version: VERSION, records, days: { ...incoming.days, ...current.days } };
}
