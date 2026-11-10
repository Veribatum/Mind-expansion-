import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOK_STORIES } from '../book-stories.js';
import { EDITORIAL } from '../cards.js';
import { DEEP_CARDS } from '../deep-cuts.js';
import { authoredLesson } from '../lessons.js';
import { FEATURED } from '../swipe-stories.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json',
};
const files = (await readdir(root)).filter(name => types[extname(name)]);
files.push(...(await readdir(join(root, 'media'))).filter(name => types[extname(name)]).map(name => 'media/' + name));
const assets = {};
for (const path of files.sort()) {
  const bytes = await readFile(join(root, path));
  assets['/' + path] = {
    data: bytes.toString('base64'), length: bytes.length, type: types[extname(path)],
    etag: '"' + createHash('sha256').update(bytes).digest('hex').slice(0, 24) + '"',
  };
}
const bundled = [...BOOK_STORIES, ...EDITORIAL, ...DEEP_CARDS, ...FEATURED].map(authoredLesson)
  .map(({ id, title, kicker, source }) => ({ id, title, kicker, source: source.title }));
// Package the dependency-free worker as a single ES module. Browser assets keep
// their existing URLs, including the manifest and service-worker script.
const learning = (await readFile(join(root, 'learning.js'), 'utf8')).replace(/^export /gm, '');
const worker = (await readFile(join(root, 'worker/index.js'), 'utf8')).replace(/^import .*\n/, '');
const source = `${learning}\n${worker}\nconst assets = ${JSON.stringify(assets)};\nconst bundled = ${JSON.stringify(bundled)};\nexport default createWorker(assets, bundled);\n`;
await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'server'), { recursive: true });
await writeFile(join(dist, 'server/index.js'), source);
try {
  await mkdir(join(dist, '.openai'), { recursive: true });
  await cp(join(root, '.openai/hosting.json'), join(dist, '.openai/hosting.json'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
console.log(`Built Mind Expansion worker with ${files.length} app assets.`);
