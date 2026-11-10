import { normalize } from './learning.js?v=7';

const feedback = record => record?.feedback || 0;
const features = card => [
  ['topic:' + card.topic, .55], ['kind:' + card.kind, .12],
  ['author:' + normalize(card.source.byline), 1.5],
  ...card.tags.map(tag => ['tag:' + normalize(tag), 1]),
];
export function affinity(card, records = {}) {
  const weights = new Map();
  for (const record of Object.values(records)) {
    if (!feedback(record)) continue;
    for (const [key, weight] of features(record.card)) {
      weights.set(key, (weights.get(key) || 0) + feedback(record) * weight);
    }
  }
  return features(card).reduce((sum, [key, weight]) => sum + Math.max(-4, Math.min(4, weights.get(key) || 0)) * weight, 0);
}

// Exclude explicit dislikes, prefer shared interests, and keep an exploration slot
// every fourth card so one early rating does not collapse the feed into one subject.
export function rankCards(cards, records = {}) {
  const candidates = cards.filter(card => feedback(records[card.id]) !== -1);
  const ranked = candidates.map((card, order) => ({ card, order,
    score: affinity(card, records) - (records[card.id]?.learned ? 5 : 0),
  })).sort((a, b) => b.score - a.score || a.order - b.order);
  const result = [];
  while (ranked.length) {
    let slot = result.length % 4 === 3
      ? ranked.reduce((best, item, i) => item.order < ranked[best].order ? i : best, 0) : 0;
    if (result.length >= 2 && result.at(-1).topic === result.at(-2).topic) {
      const diverse = ranked.findIndex(item => item.card.topic !== result.at(-1).topic);
      if (diverse !== -1) slot = diverse;
    }
    result.push(ranked.splice(slot, 1)[0].card);
  }
  return result;
}

export function discoveryOrder(rotation, records, seed) {
  const shifted = [...rotation.slice(seed % rotation.length), ...rotation.slice(0, seed % rotation.length)];
  if (seed % 3 === 0) return shifted; // Deliberate discovery beyond past interests.
  return shifted.map((item, index) => ({ item, index, score: affinity({
    topic: item[0], kind: 'encyclopedia', source: { byline: '' }, tags: item[1],
  }, records) })).sort((a, b) => b.score - a.score || a.index - b.index).map(x => x.item);
}
export function feedbackKey(records = {}) {
  return Object.values(records).filter(r => feedback(r) || r.learned)
    .map(r => [r.card.id, feedback(r), r.learned].join(':')).sort().join('|');
}
