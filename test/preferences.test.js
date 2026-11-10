import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOK_STORIES } from '../book-stories.js';
import { DEEP_CARDS } from '../deep-cuts.js';
import { affinity, discoveryOrder, rankCards } from '../preferences.js';
import { decodeState, mergeState, newRecord, newState, validCard } from '../learning.js';
import { openingCards } from '../swipe-stories.js';

const byId = id => BOOK_STORIES.find(c => c.id === id);
const voted = (id, feedback, updatedAt = '2026-11-05T12:00:00Z') => ({ ...newRecord(byId(id)), feedback, updatedAt });

test('book and history lessons fit the archive schema and contain an example or mechanism', () => {
  assert.ok(BOOK_STORIES.filter(card => card.source.byline.startsWith('Sun Tzu')).length >= 3);
  BOOK_STORIES.forEach(card => {
    assert.ok(validCard(card), card.id);
    assert.ok(card.lesson.steps.length >= 3);
    assert.ok(card.intro.split(/\s+/).length >= 65);
  });
  assert.ok(BOOK_STORIES.some(c => c.source.title.startsWith('Think and Grow Rich')));
});

test('ratings reorder related authors, exclude disliked ideas, and undo restores eligibility', () => {
  const records = { 'voss-mirror': voted('voss-mirror', 1), 'ghost-army': voted('ghost-army', -1) };
  assert.ok(affinity(byId('voss-label'), records) > affinity(byId('clear-two-minutes'), records));
  const before = openingCards(null, [], '2026-11-05');
  const after = rankCards(before, records);
  assert.ok(after.findIndex(c => c.id === 'voss-label') < before.findIndex(c => c.id === 'voss-label'));
  assert.ok(!after.some(c => c.id === 'ghost-army'));
  assert.ok(after.some(c => c.topic === 'culture'));
  records['ghost-army'].feedback = 0;
  assert.ok(rankCards(BOOK_STORIES, records).some(c => c.id === 'ghost-army'));
  records['voss-mirror'].feedback = -1;
  assert.ok(affinity(byId('voss-label'), records) < 0);
});

test('ratings survive JSON backup, legacy backups, merges, and keep notes and review data', () => {
  const state = newState();
  const record = { ...voted('voss-mirror', -1), saved: true, note: 'Try this at work', learned: '2026-11-04', due: '2026-11-07', step: 1, reviews: 2 };
  state.records[record.card.id] = record;
  const restored = decodeState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  const legacy = JSON.parse(JSON.stringify(state));
  delete legacy.records['voss-mirror'].feedback;
  assert.ok(decodeState(legacy));
  const newer = newState();
  newer.records['voss-mirror'] = { ...record, feedback: 0, updatedAt: '2026-11-05T13:00:00Z' };
  const merged = mergeState(restored, newer).records['voss-mirror'];
  assert.equal(merged.feedback, 0);
  assert.equal(merged.note, record.note);
  assert.equal(merged.due, record.due);
  state.records['voss-mirror'].feedback = 2;
  assert.throws(() => decodeState(state), /can’t read/);
});

test('opening editions mix usable books, history and animals without the already-known art story', () => {
  for (const day of ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']) {
    const deck = openingCards(null, [], day);
    assert.ok(deck.slice(0, 6).some(c => c.kind === 'book'));
    assert.ok(deck.slice(0, 6).some(c => c.topic === 'culture'));
    assert.ok(deck.slice(0, 6).some(c => c.topic === 'animals'));
    assert.ok(!deck.some(c => c.id === 'cold-war-art'));
    assert.equal(new Set(deck.map(c => c.id)).size, deck.length);
  }
  const disliked = DEEP_CARDS.find(c => c.id === 'beluga-half-sleep');
  const records = { [disliked.id]: { ...newRecord(disliked), feedback: -1 } };
  assert.ok(!openingCards(disliked, [], '2026-11-05', records).some(c => c.id === disliked.id));
});

test('discovery follows interests but keeps periodic exploration', () => {
  const rotation = [['animals', ['Ethology']], ['mind', ['conversation']], ['culture', ['history']]];
  const records = { 'voss-mirror': voted('voss-mirror', 1) };
  assert.equal(discoveryOrder(rotation, records, 2)[0][0], 'mind');
  assert.equal(discoveryOrder(rotation, records, 3)[0][0], 'animals');
});

test('the fresh feed skips prior engagement and views while the history and video collections remain browsable', () => {
  const records = {
    'voss-mirror': voted('voss-mirror', 1),
    'hill-persistence': { ...voted('hill-persistence', 0), learned: '2026-11-09' },
    'clear-two-minutes': { ...voted('clear-two-minutes', 0), saved: true },
  };
  const viewed = new Set(['ghost-army', 'beluga-half-sleep', 'octopus-hunting-team']);
  const day = '2026-11-10';
  const deck = openingCards(null, [], day, records, [], { viewed });
  assert.ok(deck.length > 0);
  assert.ok(deck.every(card => !Object.hasOwn(records, card.id) && !viewed.has(card.id)));
  assert.ok(deck.findIndex(card => card.id === 'voss-label') < deck.findIndex(card => card.id === 'covey-big-rocks'));
  assert.ok(deck.slice(0, 4).some(card => card.topic === 'culture' || card.topic === 'mysteries'));
  const history = openingCards(null, [], day, records, [], { viewed, mode: 'history' });
  assert.equal(history[0].id, 'ghost-army');
  assert.ok(history.some(card => card.id === 'skinner-pigeons'));
  const videos = openingCards(null, [], day, records, [], { viewed, mode: 'videos' });
  assert.ok(videos.some(card => card.id === 'voss-mirror'));
});

test('a new session does not replay the same opening video after it was viewed', () => {
  const day = '2026-11-10';
  const first = openingCards(null, [], day);
  const again = openingCards(null, [], day, {}, [], { viewed: new Set([first[0].id]) });
  assert.notEqual(first[0].id, again[0].id);
  assert.ok(!again.some(card => card.id === first[0].id));
});
