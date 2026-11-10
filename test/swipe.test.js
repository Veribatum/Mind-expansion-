import assert from 'node:assert/strict';
import test from 'node:test';
import { EDITORIAL } from '../cards.js';
import { DEEP_CARDS } from '../deep-cuts.js';
import { SOURCE_TEXT } from './fixture.js';
import { existsSync } from 'node:fs';
import { exploreIdeas } from '../feed.js';
import { validCard } from '../learning.js';
import { storyArt } from '../swipe-art.js';
import { discoverClip, featuredClip } from '../swipe-media.js';
import { FEATURED, beatSeconds, cardKey, openingCards, storyFor } from '../swipe-stories.js';

test('the opening set contains complete lessons and preserves the daily reading', () => {
  const daily = EDITORIAL[0];
  const live = { ...DEEP_CARDS[0], id: 'simple-wiki-1', title: 'An unfamiliar live idea', kicker: 'Learning' };
  const deck = openingCards(daily, [live, daily], '2026-11-05');
  assert.ok(featuredClip(deck[0])?.local);
  assert.ok(deck.slice(0, 4).some(card => card.source.byline.startsWith('Sun Tzu')));
  assert.ok(deck.some(card => card.id === daily.id));
  for (const id of ['beluga-half-sleep', 'octopus-hunting-team']) {
    const clip = featuredClip(DEEP_CARDS.find(card => card.id === id));
    assert.ok(existsSync(new URL(clip.url, new URL('..', import.meta.url))));
    assert.match(clip.license, /^CC BY/);
  }
  assert.ok(deck.some(card => card.id === live.id));
  assert.equal(new Set(deck.map(cardKey)).size, deck.length);
  for (const card of [...deck, ...FEATURED, ...DEEP_CARDS]) {
    assert.ok(validCard(card));
    const story = storyFor(card);
    assert.ok(story.beats.length);
    story.beats.forEach(([, text], i) => {
      assert.ok(beatSeconds(text) >= 6);
      assert.match(storyArt(story.art, i), /^<svg/);
    });
  }
});

test('live discovery skips ideas already in the deck across category requests', async () => {
  const pages = [1, 2, 3].map(pageid => ({
    pageid, title: 'Concept ' + pageid, ns: 0, fullurl: 'https://simple.wikipedia.org/wiki/Concept_' + pageid,
    extract: SOURCE_TEXT,
  }));
  const fetcher = async url => {
    if (url.searchParams.has('list')) return Response.json({ query: { categorymembers: pages } });
    const wanted = url.searchParams.get('pageids').split('|').map(Number);
    return Response.json({ query: { pages: pages.filter(page => wanted.includes(page.pageid)) } });
  };
  const result = await exploreIdeas({
    day: '2026-11-04', batch: 0, seen: new Set(['simple-wiki-1', 'concept 2']),
    signal: new AbortController().signal, fetcher,
  });
  assert.deepEqual(result.map(card => card.id), ['simple-wiki-3']);
});

test('clip discovery accepts related media with attribution and rejects missing licensing or unrelated media', async () => {
  const card = { id: 'simple-wiki-123', title: 'Double pendulum' };
  let commonsRequests = 0;
  const fetcher = license => async url => {
    if (url.hostname === 'simple.wikipedia.org') {
      return Response.json({ query: { pages: [{ images: [
        { title: 'File:Unrelated video.webm' }, { title: 'File:Double pendulum demonstration.webm' },
      ] }] } });
    }
    commonsRequests++;
    assert.equal(url.searchParams.get('titles'), 'File:Double pendulum demonstration.webm');
    return Response.json({ query: { pages: [{
      title: 'File:Double pendulum demonstration.webm',
      imageinfo: [{
        url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Double_pendulum.webm',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Double_pendulum.webm',
        mime: 'video/webm', size: 1000000, extmetadata: {
          LicenseShortName: { value: license },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by/4.0/' },
          Artist: { value: 'Example contributor' },
        },
      }],
    }] } });
  };
  const signal = new AbortController().signal;
  const result = await discoverClip(card, signal, fetcher('CC BY 4.0'));
  assert.equal(result.credit, 'Example contributor');
  assert.equal(result.previewEnd, 35);
  assert.equal(await discoverClip(card, signal, fetcher('All rights reserved')), null);
  assert.equal(commonsRequests, 2);
});
