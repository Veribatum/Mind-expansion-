import { normalize, validCard } from '../learning.js';

const PAGE_SIZE = 24;
const MAX_BATCH = 8;
const MAX_BODY = 64 * 1024;
const PROTOCOL = '2026-07-28';
const RPC_TOOLS = [
  {
    name: 'list_lessons',
    description: 'Read the latest published lessons and the bundled lesson index. Use the returned next cursor to check older catalog pages for duplicates.',
    inputSchema: {
      type: 'object', properties: { before: { type: 'integer', minimum: 1 } }, additionalProperties: false,
    },
  },
  {
    name: 'publish_lessons',
    description: 'Append up to eight verified original one-minute lessons to this private feed. Repeated IDs, titles, and subjects are skipped. Read them back with list_lessons.',
    inputSchema: {
      type: 'object', required: ['lessons'], additionalProperties: false,
      properties: {
        lessons: {
          type: 'array', minItems: 1, maxItems: MAX_BATCH,
          items: {
            type: 'object',
            required: ['id', 'topic', 'kind', 'title', 'kicker', 'source', 'tags', 'steps', 'question', 'answer', 'takeaway'],
            properties: {
              id: { type: 'string', pattern: '^lesson-[a-z0-9-]+$' },
              topic: { enum: ['mind', 'thinking', 'systems', 'science', 'practice', 'animals', 'culture', 'mysteries'] },
              kind: { enum: ['book', 'research', 'essay'] },
              title: { type: 'string', maxLength: 160 },
              kicker: { type: 'string', description: 'Unique subject or concept, distinct from the source title.', maxLength: 180 },
              source: {
                type: 'object', required: ['title', 'byline', 'url'],
                properties: { title: { type: 'string' }, byline: { type: 'string' }, url: { type: 'string', format: 'uri' } },
              },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 10 },
              steps: {
                type: 'array', minItems: 3, maxItems: 4,
                items: { type: 'object', required: ['label', 'text'], properties: { label: { type: 'string' }, text: { type: 'string' } } },
              },
              question: { type: 'string' }, answer: { type: 'string' }, takeaway: { type: 'string' },
            },
          },
        },
      },
    },
  },
];

class CatalogError extends Error {}

function catalogCard(item) {
  if (!item || typeof item.id !== 'string' || !/^lesson-[a-z0-9-]+$/.test(item.id)
    || !Array.isArray(item.steps) || item.steps.length < 3 || item.steps.length > 4
    || !item.steps.every(step => typeof step?.label === 'string' && typeof step.text === 'string')
    || !['book', 'research', 'essay'].includes(item.kind) || !item.source?.byline?.trim?.()
    || !Array.isArray(item.tags) || item.tags.length < 2 || item.tags.length > 10) {
    throw new CatalogError('Each lesson needs an author, source, 3–4 steps, and the required lesson fields.');
  }
  const steps = item.steps.map(({ label, text }) => ({ label, text }));
  const intro = steps.map(step => step.text).join('\n\n');
  const words = intro.trim().split(/\s+/).length;
  if (words < 65 || words > 160 || steps.some(step => step.text.trim().split(/\s+/).length > 60)) {
    throw new CatalogError('Keep each lesson to 65–160 words and each step to 60 words or less.');
  }
  const { id, title, kicker, topic, kind, question, answer, takeaway, tags } = item;
  const source = { title: item.source.title, byline: item.source.byline, url: item.source.url };
  const card = { id, title, kicker, topic, kind, intro, example: '', prompt: question, answer, source, tags,
    lesson: { title, steps, question, answer, takeaway } };
  if (!validCard(card) || !normalize(kicker) || !normalize(title)) {
    throw new CatalogError('A lesson contains invalid text or is missing a valid HTTPS source.');
  }
  return card;
}

async function listLessons(db, before) {
  const cursor = before == null ? Number.MAX_SAFE_INTEGER : Number(before);
  if (!Number.isSafeInteger(cursor) || cursor < 1) throw new CatalogError('Invalid catalog cursor.');
  const { results } = await db.prepare('SELECT seq, body FROM lessons WHERE seq < ? ORDER BY seq DESC LIMIT ?')
    .bind(cursor, PAGE_SIZE + 1).all();
  const page = results.slice(0, PAGE_SIZE);
  return { cards: page.map(row => JSON.parse(row.body)), next: results.length > PAGE_SIZE ? page.at(-1).seq : null };
}

async function publishLessons(db, items, bundled) {
  if (!Array.isArray(items) || !items.length || items.length > MAX_BATCH) {
    throw new CatalogError('Publish between one and eight lessons at a time.');
  }
  const cards = items.map(catalogCard);
  const existingIds = new Set(bundled.map(card => card.id));
  const existingTitles = new Set(bundled.map(card => normalize(card.title)));
  const existingSubjects = new Set(bundled.map(card => normalize(card.kicker)));
  const added = [];
  const skipped = [];
  const pending = [];
  for (const card of cards) {
    if (existingIds.has(card.id) || existingTitles.has(normalize(card.title)) || existingSubjects.has(normalize(card.kicker))) {
      skipped.push(card.id);
      continue;
    }
    pending.push(card);
  }
  if (pending.length) {
    const results = await db.batch(pending.map(card => db.prepare(
      'INSERT INTO lessons (id, title_key, subject_key, body) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING',
    ).bind(card.id, normalize(card.title), normalize(card.kicker), JSON.stringify(card))));
    results.forEach((result, i) => (result.meta.changes ? added : skipped).push(pending[i].id));
  }
  return { added, skipped };
}

const json = (value, status = 200) => Response.json(value, {
  status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
});
async function handleCatalog(request, url, db, bundled) {
  if (!db) return json({ error: 'Lesson catalog unavailable' }, 503);
  try {
    if (request.method === 'GET') {
      const page = await listLessons(db, url.searchParams.get('before'));
      return json(url.searchParams.get('index') === '1' ? { ...page, bundled } : page);
    }
    if (request.method !== 'POST') return json({ error: 'Use GET or POST' }, 405);
    // The Sites gateway requires owner or service access. Reject cross-origin
    // browser submissions and accept only explicit JSON publication requests.
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return json({ error: 'Cross-origin write rejected' }, 403);
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return json({ error: 'Send application/json' }, 415);
    }
    if (Number(request.headers.get('content-length')) > MAX_BODY) return json({ error: 'Request too large' }, 413);
    const body = await request.text();
    if (body.length > MAX_BODY) return json({ error: 'Request too large' }, 413);
    return json(await publishLessons(db, JSON.parse(body)?.lessons, bundled));
  } catch (error) {
    if (error instanceof CatalogError) return json({ error: error.message }, 400);
    if (error instanceof SyntaxError) return json({ error: 'Invalid JSON' }, 400);
    console.error('Catalog request failed', error);
    return json({ error: 'Lesson catalog unavailable' }, 503);
  }
}

const content = (value, isError = false) => ({ content: [{ type: 'text', text: JSON.stringify(value) }], isError });

async function handleMcp(request, db, bundled) {
  if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
  if (request.headers.has('origin') && request.headers.get('origin') !== new URL(request.url).origin) {
    return json({ error: 'This origin cannot write lessons' }, 403);
  }
  let rpc;
  try {
    if (Number(request.headers.get('content-length')) > MAX_BODY) return json({ error: 'Request too large' }, 413);
    const body = await request.text();
    if (body.length > MAX_BODY) return json({ error: 'Request too large' }, 413);
    rpc = JSON.parse(body);
  } catch {
    return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Invalid JSON' } }, 400);
  }
  const reply = result => json({ jsonrpc: '2.0', id: rpc?.id ?? null, result });
  switch (rpc?.method) {
    case 'server/discover': return reply({ supportedVersions: [PROTOCOL], capabilities: { tools: {} } });
    case 'initialize': return reply({ protocolVersion: rpc.params?.protocolVersion || PROTOCOL,
      serverInfo: { name: 'mind-expansion', version: '1.0.0' }, capabilities: { tools: {} } });
    case 'notifications/initialized': return new Response(null, { status: 202 });
    case 'ping': return reply({});
    case 'tools/list': return reply({ tools: RPC_TOOLS });
    case 'tools/call': {
      const args = rpc.params?.arguments || {};
      try {
        if (!db) throw new CatalogError('The lesson database is unavailable.');
        if (rpc.params?.name === 'list_lessons') {
          const { cards, next } = await listLessons(db, args.before);
          const summarize = ({ id, title, kicker, source }) => ({ id, title, kicker, source: source.title });
          const value = { lessons: cards.map(summarize), next };
          if (args.before == null) value.bundled = bundled;
          return reply(content(value));
        }
        if (rpc.params?.name === 'publish_lessons') return reply(content(await publishLessons(db, args.lessons, bundled)));
        return reply(content({ error: 'Unknown catalog tool' }, true));
      } catch (error) {
        if (!(error instanceof CatalogError)) console.error('Catalog tool failed', error);
        return reply(content({ error: error instanceof CatalogError ? error.message : 'The lesson database is unavailable.' }, true));
      }
    }
    default: return json({ jsonrpc: '2.0', id: rpc?.id ?? null, error: { code: -32601, message: 'Unknown method' } }, 400);
  }
}

function byteRange(value, length) {
  const parts = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!parts || (!parts[1] && !parts[2])) return null;
  if (!parts[1]) {
    const suffix = Number(parts[2]);
    return suffix > 0 ? [Math.max(0, length - suffix), length - 1] : null;
  }
  const start = Number(parts[1]);
  const end = parts[2] ? Math.min(length - 1, Number(parts[2])) : length - 1;
  return start < length && start <= end ? [start, end] : null;
}

function serveAsset(request, asset) {
  const media = asset.type === 'video/mp4';
  const headers = new Headers({
    'Content-Type': asset.type, 'Content-Length': String(asset.length), ETag: asset.etag,
    'Cache-Control': media || asset.type.startsWith('image/') ? 'private, max-age=3600' : 'private, no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  if (media) headers.set('Accept-Ranges', 'bytes');
  const requestedRange = request.headers.get('range');
  const ifRange = request.headers.get('if-range');
  if (!requestedRange && request.headers.get('if-none-match') === asset.etag) {
    headers.delete('Content-Length');
    return new Response(null, { status: 304, headers });
  }
  if (request.method === 'HEAD') return new Response(null, { headers });
  const bytes = () => Uint8Array.from(atob(asset.data), char => char.charCodeAt(0));
  if (media && requestedRange && (!ifRange || ifRange === asset.etag)) {
    const range = byteRange(requestedRange, asset.length);
    if (!range) {
      headers.set('Content-Range', `bytes */${asset.length}`);
      headers.delete('Content-Length');
      return new Response(null, { status: 416, headers });
    }
    const [start, end] = range;
    headers.set('Content-Range', `bytes ${start}-${end}/${asset.length}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(bytes().slice(start, end + 1), { status: 206, headers });
  }
  return new Response(bytes(), { headers });
}

// Sites dispatch authenticates this owner-private app before routing requests here.
// The shared catalog has no access to the user's browser-local learning records.
export function createWorker(assets, bundled) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname === '/mcp') return handleMcp(request, env.DB, bundled);
      if (url.pathname === '/api/lessons') return handleCatalog(request, url, env.DB, bundled);
      if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Use GET' }, 405);
      const path = url.pathname === '/' ? '/index.html' : url.pathname;
      if (!Object.hasOwn(assets, path)) return new Response('Not found', { status: 404 });
      return serveAsset(request, assets[path]);
    },
  };
}
