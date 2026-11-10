import { validCard } from './learning.js?v=7';

export async function fetchCatalog({ before, signal = AbortSignal.timeout(4000) } = {}) {
  const url = new URL('./api/lessons', location.href);
  if (before) url.searchParams.set('before', String(before));
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Lesson catalog unavailable');
  }
  const value = await response.json();
  if (!Array.isArray(value.cards)) throw new Error('Invalid lesson catalog');
  return {
    cards: value.cards.filter(card => validCard(card) && card.lesson),
    next: Number.isSafeInteger(value.next) && value.next > 0 ? value.next : null,
  };
}
