import { normalize } from './learning.js?v=7';

const SVS = 'https://svs.gsfc.nasa.gov';
const NASA_CREDIT = 'NASA Scientific Visualization Studio';
const PUBLIC_DOMAIN = SVS + '/help/';
const FEATURED_CLIPS = {
  'voss-mirror': {
    title: 'Try a mirror in conversation', url: './media/voss-mirror.mp4', poster: './media/voss-mirror.jpg',
    page: 'https://info.blackswanltd.com/hubfs/The%20Black%20Swan%20Group%20Leadership%20Guide.pdf',
    credit: 'Mind Expansion · animated example', license: 'Original animation', duration: 12, local: true,
  },
  'beluga-half-sleep': {
    title: 'Beluga swimming at Oceanogràfic Valencia',
    url: './media/beluga.mp4', poster: './media/beluga.jpg', duration: 10,
    page: 'https://commons.wikimedia.org/wiki/File:Beluga_Oceanografic.webm',
    credit: 'Toniher · Wikimedia Commons',
    license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    note: 'Illustrative footage · trimmed and re-encoded without audio',
    local: true,
  },
  'octopus-hunting-team': {
    title: 'Octopus and fish hunting together in the Red Sea',
    url: './media/octopus-hunt.mp4?v=2', poster: './media/octopus-hunt.jpg', duration: 9,
    page: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11541198/',
    credit: 'Eduardo Sampaio and colleagues · Supplementary Video 1',
    license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    note: 'Research footage · trimmed and re-encoded without audio',
    local: true,
  },
  'lunar-phases': {
    title: 'Moon Phases Loop', page: SVS + '/4310/',
    url: SVS + '/vis/a000000/a004300/a004310/moon_720p30.mp4', credit: NASA_CREDIT + ' · Ernie Wright',
    license: 'Public domain', licenseUrl: PUBLIC_DOMAIN,
  },
  'ocean-eddies': {
    title: 'Perpetual Ocean', page: SVS + '/3827/',
    url: SVS + '/vis/a000000/a003800/a003827/perpetual_ocean_1080p30.mp4',
    credit: 'NASA Scientific Visualization Studio · Greg Shirah, Horace Mitchell, and Victoria Weeks',
    license: 'Public domain', licenseUrl: PUBLIC_DOMAIN, previewEnd: 24,
  },
};

const CONCEPTS = {
  'beluga whale': 'beluga-half-sleep', 'beluga': 'beluga-half-sleep',
  'day octopus': 'octopus-hunting-team', 'octopus cyanea': 'octopus-hunting-team',
  'lunar phase': 'lunar-phases', 'lunar phases': 'lunar-phases',
  'phase of the moon': 'lunar-phases', 'phases of the moon': 'lunar-phases',
  'moon phase': 'lunar-phases', 'moon phases': 'lunar-phases',
  'ocean current': 'ocean-eddies', 'ocean currents': 'ocean-eddies',
  'ocean eddy': 'ocean-eddies', 'ocean eddies': 'ocean-eddies',
};

export function featuredClip(card) {
  const id = Object.hasOwn(FEATURED_CLIPS, card.id) ? card.id : CONCEPTS[normalize(card.title)];
  return Object.hasOwn(FEATURED_CLIPS, id) ? FEATURED_CLIPS[id] : null;
}

export function canFindClip(card) {
  return /^simple-wiki-\d+$/.test(card.id);
}

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const SIMPLE_API = 'https://simple.wikipedia.org/w/api.php';

async function api(endpoint, params, signal, fetcher) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', ...params });
  const res = await fetcher(url, { credentials: 'omit', signal });
  if (!res.ok) throw new Error('Video source unavailable');
  const value = await res.json();
  if (value.error) throw new Error('Video source unavailable');
  return value.query?.pages || [];
}

function knownUrl(value, host) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === host ? url.href : '';
  } catch {
    return '';
  }
}

function plainText(html) {
  if (!/[<&]/.test(html)) return html.trim().slice(0, 190);
  if (typeof DOMParser === 'undefined') return '';
  return (new DOMParser().parseFromString(html, 'text/html').body.textContent || '').trim().slice(0, 190);
}

function commonsClip(page) {
  const info = page?.imageinfo?.[0];
  const meta = info?.extmetadata;
  const license = meta?.LicenseShortName?.value || '';
  const credit = plainText(meta?.Artist?.value || meta?.Credit?.value || '');
  const pageUrl = knownUrl(info?.descriptionurl, 'commons.wikimedia.org');
  const videoUrl = knownUrl(info?.url, 'upload.wikimedia.org');
  const licenseUrl = knownUrl(meta?.LicenseUrl?.value, 'creativecommons.org');
  const cc = /^CC (?:BY(?:-SA)? \d\.\d|0)$/i.test(license) && licenseUrl;
  const publicDomain = /^public domain$/i.test(license);
  if ((!cc && !publicDomain) || !credit || !videoUrl || !pageUrl || info.size > 40_000_000
    || !['video/webm', 'video/ogg', 'video/mp4', 'application/ogg'].includes(info.mime)) return null;
  return {
    url: videoUrl, page: pageUrl, credit, license, licenseUrl,
    title: page.title.replace(/^File:/i, '').replace(/\.[^.]+$/, ''),
    previewEnd: 35,
  };
}

const stopWords = new Set(['from', 'with', 'theory', 'history', 'about', 'concept', 'general']);
export async function discoverClip(card, signal, fetcher = fetch) {
  if (!canFindClip(card)) return null;
  const pages = await api(SIMPLE_API, {
    pageids: card.id.slice('simple-wiki-'.length), prop: 'images', imlimit: '50',
  }, signal, fetcher);
  const words = normalize(card.title).split(' ').filter(word => word.length > 3 && !stopWords.has(word));
  const files = (pages[0]?.images || [])
    .filter(file => /\.(webm|ogv|mp4)$/i.test(file.title)
      && words.some(word => normalize(file.title).split(' ').includes(word)))
    .slice(0, 5);
  if (!files.length) return null;
  const entries = await api(COMMONS_API, {
    titles: files.map(file => file.title).join('|'), prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|Credit',
  }, signal, fetcher);
  return entries.map(commonsClip).find(Boolean) || null;
}
