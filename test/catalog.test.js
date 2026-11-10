import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createWorker } from '../worker/index.js';
import { decodeState, finishReview, learn, mergeState, newRecord, newState, progressFor } from '../learning.js';
import { BOOK_STORIES } from '../book-stories.js';

const seed = JSON.parse(readFileSync(new URL('../data/launch-lessons.json', import.meta.url)));
const migration = readFileSync(new URL('../drizzle/0000_lesson_catalog.sql', import.meta.url), 'utf8');

function database() {
  const db = new DatabaseSync(':memory:');
  db.exec(migration);
  const prepare = sql => ({ bind: (...args) => ({
    all: () => ({ results: db.prepare(sql).all(...args) }),
    run: () => ({ meta: db.prepare(sql).run(...args) }),
  }) });
  return { prepare, batch: statements => statements.map(statement => statement.run()), close: () => db.close() };
}

test('unattended publisher appends source lessons once and the browser can read them back', async t => {
  const DB = database();
  t.after(() => DB.close());
  const app = createWorker({}, BOOK_STORIES);
  const publish = async (lessons, headers = {}) => {
    const response = await app.fetch(new Request('https://mind.example/api/lessons', {
      method: 'POST', body: JSON.stringify({ lessons }),
      headers: { 'Content-Type': 'application/json', ...headers },
    }), { DB });
    return { ...await response.json(), status: response.status };
  };
  const result = await publish(seed);
  assert.equal(result.status, 200);
  assert.deepEqual(result.added, seed.map(card => card.id));
  assert.deepEqual((await publish(seed)).added, []);
  assert.deepEqual((await publish([{ ...seed[0], id: 'lesson-duplicate-title' }])).skipped, ['lesson-duplicate-title']);
  assert.equal((await publish([{ ...seed[0], id: 'lesson-missing-source', source: { ...seed[0].source, url: 'http://example.com' } }])).status, 400);
  assert.equal((await publish(seed, { Origin: 'https://different.example' })).status, 403);
  const response = await app.fetch(new Request('https://mind.example/api/lessons?index=1'), { DB });
  const page = await response.json();
  assert.equal(page.cards.length, seed.length);
  assert.equal(page.cards[0].lesson.steps.length, 3);
  assert.equal(page.next, null);
  assert.equal(page.bundled.length, BOOK_STORIES.length);
});

test('inline MP4 serving returns byte ranges including the first two bytes requested by mobile players', async () => {
  const bytes = readFileSync(new URL('../media/beluga.mp4', import.meta.url));
  const worker = createWorker({ '/media/beluga.mp4': { data: bytes.toString('base64'), type: 'video/mp4', length: bytes.length, etag: '"beluga"' } }, []);
  const media = new Request('https://mind.example/media/beluga.mp4', { headers: { range: 'bytes=0-1' } });
  const response = await worker.fetch(media, {});
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-range'), `bytes 0-1/${bytes.length}`);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array(bytes.subarray(0, 2)));
  const impossible = new Request(media.url, { headers: { range: 'bytes=99999999-' } });
  assert.equal((await worker.fetch(impossible, {})).status, 416);
});

test('old learned dates and completed reviews count distinct days through reload and backup merge', () => {
  const state = newState();
  const card = BOOK_STORIES[0];
  const learned = learn(newRecord(card), '2026-11-08', '2026-11-08T12:00:00Z');
  state.records[card.id] = { ...learned, reviews: 3 }; // Legacy record has no review dates.
  const incoming = newState();
  incoming.records[card.id] = finishReview(finishReview(state.records[card.id], '2026-11-09', '2026-11-09T12:00:00Z'), '2026-11-09', '2026-11-09T12:05:00Z');
  const merged = decodeState(JSON.parse(JSON.stringify(mergeState(state, incoming))));
  const progress = progressFor(merged, '2026-11-10');
  assert.equal(progress.streak, 2);
  assert.equal(progress.learnedThisWeek, 0);
  assert.equal(progress.week[0].reviewed, 1);
  assert.equal(progress.total, 1);
  assert.equal(progress.due, 1);
  assert.equal(progressFor(merged, '2026-11-11').streak, 0);
});
