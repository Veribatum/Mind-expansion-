import assert from 'node:assert/strict';
import test from 'node:test';
import { DEEP_CARDS } from '../deep-cuts.js';
import { newRecord, learn, rate, validCard } from '../learning.js';
import { upgradeLessonState } from '../lessons.js';
import { buildSourceLesson } from '../source-lessons.js';

import { SOURCE_TEXT } from './fixture.js';

test('a brief encyclopedia introduction cannot enter the lesson feed', () => {
  assert.equal(buildSourceLesson('Learning', SOURCE_TEXT.split('\n\n')[0]), null);
  const lesson = buildSourceLesson('Conditioned response', SOURCE_TEXT);
  assert.equal(lesson.steps.length, 3);
  assert.match(lesson.steps[1].text, /because/);
  assert.match(lesson.steps[2].text, /example/);
});

test('updating an archived lesson preserves the learner’s notes and review schedule', () => {
  const revised = DEEP_CARDS.find(card => card.id === 'choice-blindness');
  const old = { ...revised, title: 'Old short teaser', intro: 'Old short introduction' };
  delete old.lesson;
  const record = { ...rate(learn(newRecord(old), '2026-11-01'), 'got-it', '2026-11-02'),
    note: 'Compare decision criteria before buying equipment', saved: true };
  const upgraded = upgradeLessonState({ version: 1, records: { [old.id]: record }, days: { '2026-11-01': old } });
  assert.equal(upgraded.records[old.id].card.title, revised.title);
  assert.equal(upgraded.days['2026-11-01'].lesson.steps.length, 4);
  const { card, ...progress } = upgraded.records[old.id];
  const { card: oldCard, ...oldProgress } = record;
  assert.deepEqual(progress, oldProgress);
  assert.ok(validCard(card));
});
