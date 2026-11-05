import assert from 'node:assert/strict';
import test from 'node:test';
import { BOOK_STORIES } from '../book-stories.js';
import { EDITORIAL } from '../cards.js';
import { SOURCE_TEXT } from './fixture.js';
import { DEEP_CARDS } from '../deep-cuts.js';
import { selectIdea } from '../feed.js';
import {
  addDays, decodeState, dueRecords, learn, matches, mergeState, newRecord, newState,
  rate, validCard,
} from '../learning.js';

const card = EDITORIAL[0];
const day = '2026-11-04';

test('editorial cards are valid, uniquely identified, and searchable by researcher', () => {
  assert.ok(EDITORIAL.every(validCard));
  assert.equal(new Set(EDITORIAL.map(item => item.id)).size, EDITORIAL.length);
  assert.ok(matches(newRecord(card), 'karpicke roediger'));
  assert.ok(matches({ ...newRecord(card), note: 'My Wireshark exercise' }, 'wireshark'));
});

test('recall dates advance across month boundaries and a miss resets spacing', () => {
  const state = newState();
  const started = learn(newRecord(card), '2026-10-31');
  state.records[card.id] = started;
  assert.equal(started.due, '2026-11-01');
  assert.equal(dueRecords(state, '2026-10-31').length, 0);
  assert.equal(dueRecords(state, '2026-11-01').length, 1);
  const correct = rate(started, 'got-it', '2026-11-01');
  assert.equal(correct.due, '2026-11-04');
  assert.equal(rate(correct, 'again', '2026-11-04').due, '2026-11-05');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
});

test('backup merge preserves newer bookmarks and the current daily choice', () => {
  const current = newState();
  const other = newState();
  const record = learn(newRecord(card), day, '2026-11-04T11:00:00Z');
  current.records[card.id] = { ...record, saved: false, updatedAt: '2026-11-04T12:00:00Z' };
  other.records[card.id] = { ...record, saved: true };
  current.days[day] = card;
  other.days[day] = EDITORIAL[1];
  const merged = mergeState(current, decodeState(JSON.parse(JSON.stringify(other))));
  assert.equal(merged.records[card.id].saved, false);
  assert.equal(merged.days[day], card);
  other.days['2026-02-31'] = card;
  assert.throws(() => decodeState(other), /invalid daily idea/);
});

function wikiFetch(url) {
  const pages = [
    { pageid: 1, title: 'Test idea one', ns: 0 },
    { pageid: 2, title: 'Test idea two', ns: 0 },
  ];
  if (url.searchParams.has('list')) {
    return Promise.resolve(Response.json({ query: { categorymembers: pages } }));
  }
  const selected = url.searchParams.get('pageids').split('|').map(Number);
  return Promise.resolve(Response.json({
    query: {
      pages: pages.filter(item => selected.includes(item.pageid)).map(item => ({
        ...item,
        fullurl: 'https://simple.wikipedia.org/wiki/Test_idea_' + item.pageid,
        extract: SOURCE_TEXT,
      })),
    },
  }));
}

test('fresh days can retrieve unseen source articles and keep working offline', async () => {
  const state = newState();
  state.days[day] = card;
  const next = await selectIdea({ state, day: '2026-11-05', fetcher: wikiFetch });
  assert.equal(next.card.kind, 'encyclopedia');
  assert.equal(next.pool.length, 2);
  state.days['2026-11-05'] = next.card;
  const later = await selectIdea({ state, day: '2026-11-07', fetcher: wikiFetch });
  assert.notEqual(later.card.id, next.card.id);
  assert.equal(later.card.kind, 'encyclopedia');
  const offline = await selectIdea({ state, day: '2026-11-07', pool: next.pool, allowNetwork: false });
  assert.ok(offline.card);
  assert.notEqual(offline.card.id, next.card.id);
});

test('an exhausted offline library offers a retry without recycling old ideas', async () => {
  const state = newState();
  [...EDITORIAL, ...DEEP_CARDS, ...BOOK_STORIES].forEach((item, index) => { state.days[addDays(day, -index)] = item; });
  const result = await selectIdea({ state, day: '2026-11-07', allowNetwork: false });
  assert.equal(result.card, null);
});
