import { BOOK_STORIES } from './book-stories.js?v=6';
import { discoveryOrder, rankCards } from './preferences.js?v=6';
import { EDITORIAL } from './cards.js?v=6';
import { DEEP_CARDS } from './deep-cuts.js?v=6';
import { authoredLesson, isLesson } from './lessons.js?v=6';
import { buildSourceLesson } from './source-lessons.js?v=6';
import { dayNumber, normalize, seenCards, validCard } from './learning.js?v=6';

const WIKI = 'https://simple.wikipedia.org/w/api.php';
const ROTATION = [
  ['mind', ['Communication', 'Motivation', 'Memory', 'Human behavior', 'Cognition', 'Social psychology', 'Psychology']],
  ['thinking', ['Logic', 'Critical thinking', 'Statistics', 'Philosophy', 'Probability']],
  ['science', ['Ecology', 'Evolution', 'Astronomy', 'History of science', 'Physics', 'Geology', 'Biology']],
  ['systems', ['Economics', 'Sociology', 'Communication', 'Engineering', 'Computer science']],
  ['practice', ['Self improvement', 'Habits', 'Learning', 'Scientific method', 'Education', 'Linguistics', 'Research']],
  ['animals', ['Animal behavior', 'Ethology', 'Primates', 'Cetaceans', 'Cephalopods', 'Insects']],
  ['culture', ['History', 'World War II', 'Military history', 'Anthropology', 'Historical events']],
  ['mysteries', ['Unexplained phenomena', 'Archaeology', 'Historical events', 'Astronomy']],
];

function hash(value) {
  let number = 2166136261;
  for (const char of value) number = Math.imul(number ^ char.codePointAt(0), 16777619);
  return number >>> 0;
}

async function query(params, signal, fetcher) {
  const url = new URL(WIKI);
  url.search = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*', ...params,
  });
  const response = await fetcher(url, { signal, credentials: 'omit' });
  if (!response.ok) throw new Error('Source unavailable');
  const data = await response.json();
  if (data.error) throw new Error('Source request failed');
  return data.query || {};
}

function toCard(page, topic, category) {
  if (!page?.extract || !page.fullurl || !page.pageid || page.missing
    || Object.hasOwn(page.pageprops || {}, 'disambiguation')) return null;
  const lesson = buildSourceLesson(page.title, page.extract);
  if (!lesson) return null;
  const card = {
    id: 'simple-wiki-' + page.pageid, topic, kind: 'encyclopedia',
    title: page.title, kicker: category,
    intro: lesson.steps.map(item => item.text).join('\n\n'), example: '',
    prompt: lesson.question, answer: lesson.answer, lesson,
    source: { title: page.title, byline: 'Simple English Wikipedia contributors', url: page.fullurl },
    tags: [category, page.title],
  };
  return validCard(card) ? card : null;
}

const skipTitle = /^(?:list of|outline of|timeline of|glossary of|history of|comparison of|category:)|\(disambiguation\)|\b(?:episode|season \d|syndrome|disorder|therapy)\b/i;
function unseenTitle(title, seen) {
  return !skipTitle.test(title) && !seen.has(normalize(title));
}

async function readPool(category, topic, day, seen, signal, fetcher) {
  const listing = await query({
    list: 'categorymembers', cmtitle: 'Category:' + category,
    cmlimit: '350', cmtype: 'page|subcat',
  }, signal, fetcher);
  const items = listing.categorymembers || [];
  const ordered = [...items].sort((a, b) =>
    hash(day + a.title) - hash(day + b.title));
  const direct = ordered.filter(page => page.ns === 0
    && unseenTitle(page.title, seen) && !seen.has('simple-wiki-' + page.pageid));
  let pagesToFetch = direct.slice(0, 14);
  if (pagesToFetch.length < 7) {
    const child = ordered.find(page => page.ns === 14);
    if (child) {
      const branch = await query({
        list: 'categorymembers', cmtitle: child.title, cmlimit: '250',
        cmnamespace: '0', cmtype: 'page',
      }, signal, fetcher);
      const known = new Set(pagesToFetch.map(page => page.pageid));
      const extra = (branch.categorymembers || []).filter(page => !known.has(page.pageid)
        && unseenTitle(page.title, seen) && !seen.has('simple-wiki-' + page.pageid));
      extra.sort((a, b) => hash(day + a.title) - hash(day + b.title));
      pagesToFetch = pagesToFetch.concat(extra).slice(0, 14);
    }
  }
  if (!pagesToFetch.length) return [];
  const data = await query({
    pageids: pagesToFetch.map(page => page.pageid).join('|'), prop: 'extracts|info|pageprops',
    explaintext: '1', exlimit: 'max', exchars: '10000', exsectionformat: 'plain', inprop: 'url',
    ppprop: 'disambiguation',
  }, signal, fetcher);
  const results = new Map((data.pages || []).map(page => [page.pageid, page]));
  return pagesToFetch.map(page => toCard(results.get(page.pageid), topic, category)).filter(Boolean);
}

function available(card, seen) {
  return !seen.has(card.id) && ![card.title, card.id.startsWith('simple-wiki-') ? '' : card.kicker]
    .some(value => value && seen.has(normalize(value)));
}

export async function selectIdea({
  state, day, pool = [], fetcher = fetch, allowNetwork = true, timeout = 5200,
}) {
  const seen = seenCards(state, day);
  for (const card of [...Object.values(state.days), ...Object.values(state.records).map(r => r.card)]) {
    if (!card.id.startsWith('simple-wiki-') && card.kicker) seen.add(normalize(card.kicker));
  }
  const editorial = rankCards([...BOOK_STORIES, ...EDITORIAL, ...DEEP_CARDS].filter(card => card.id !== 'cold-war-art').map(authoredLesson).filter(card => available(card, seen)), state.records);
  const dayIndex = dayNumber(day);
  const personalized = Object.values(state.records).some(r => r.feedback);
  const pick = items => items[personalized ? 0 : dayIndex % items.length];
  if (!seen.size && editorial.length) return { card: editorial[0], pool };
  if (dayIndex % 3 === 0 && editorial.length) {
    return { card: pick(editorial), pool };
  }

  const rotations = discoveryOrder(ROTATION, state.records, dayIndex);
  const [topic, categories] = rotations[0];
  const index = Math.floor(dayIndex / ROTATION.length) % categories.length;
  if (allowNetwork) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const [otherTopic, otherCategories] = rotations[1];
    const lookup = (category, categoryTopic) => readPool(category, categoryTopic, day, seen,
      controller.signal, fetcher).catch(() => []);
    try {
      const primary = lookup(categories[index], topic);
      const alternate = lookup(otherCategories[Math.floor(dayIndex / 7) % otherCategories.length], otherTopic);
      const entries = await primary;
      const card = rankCards(entries, state.records).find(item => available(item, seen));
      if (card) return { card, pool: combinePool(entries, pool) };
      const secondary = await alternate;
      const secondCard = rankCards(secondary, state.records).find(item => available(item, seen));
      if (secondCard) return { card: secondCard, pool: combinePool(secondary, pool) };
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }

  const stored = pool.filter(card => isLesson(card) && available(card, seen));
  const sameTopic = stored.filter(card => card.topic === topic);
  const candidates = rankCards(sameTopic.length ? sameTopic : stored, state.records);
  return {
    card: pick(editorial) || pick(candidates) || null,
    pool,
  };
}

function combinePool(fresh, pool) {
  return [...new Map([...fresh, ...pool].map(card => [card.id, card])).values()].slice(0, 120);
}

// Discovery uses the same source and quality filters as the daily edition.
export async function exploreIdeas({ day, batch, seen, signal, records = {}, fetcher = fetch }) {
  const index = (dayNumber(day) + batch) % ROTATION.length;
  const rotations = discoveryOrder(ROTATION, records, dayNumber(day) + batch);
  const [topic, categories] = rotations[0];
  const [otherTopic, otherCategories] = rotations[2];
  const slot = Math.floor((dayNumber(day) + batch) / ROTATION.length);
  const candidates = await Promise.allSettled([
    readPool(categories[slot % categories.length], topic, day + batch, seen, signal, fetcher),
    readPool(otherCategories[(slot + batch) % otherCategories.length], otherTopic, day + batch, seen, signal, fetcher),
  ]);
  const sets = candidates.map(result => result.status === 'fulfilled' ? result.value : []);
  const used = new Set(seen);
  const cards = [];
  for (let i = 0; i < 8; i++) {
    for (const list of sets) {
      const card = list[i];
      if (!card || used.has(card.id) || used.has(normalize(card.title))) continue;
      cards.push(card);
      used.add(card.id);
      used.add(normalize(card.title));
      if (cards.length === 8) return rankCards(cards, records);
    }
  }
  return rankCards(cards, records);
}
