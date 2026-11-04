import { TOPICS, normalize } from './learning.js';
import { exploreIdeas } from './feed.js?v=2';
import { storyArt } from './swipe-art.js';
import { beatSeconds, cardKey, openingCards, storyFor } from './swipe-stories.js';
import { canFindClip, discoverClip, featuredClip } from './swipe-media.js';

const SET_SIZE = 5;
const MAX_DECK = 120;

export function mountSwipe(root, options) {
  const { day, icon, escape: esc, onAction, onPool, getRecord, getDue, resume } = options;
  const sameDay = resume?.day === day;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const button = (action, label, symbol, extra = '') =>
    `<button type="button" class="reel-tool" data-swipe="${action}" aria-label="${label}" title="${label}" ${extra}>${icon(symbol)}</button>`;
  const arrow = (direction, label) => button(direction, label, direction === 'prev' ? 'up' : 'down');
  const blank = '<div class="reel-loading" role="status">Opening the feed…</div>';
  root.innerHTML = `<section class="reel-layout" aria-label="Mind Expansion feed">
    <aside class="reel-intro">
      <p class="reel-eyebrow"><span></span> THE DISCOVERY FEED</p>
      <h1>Good things<br>to know<span>.</span></h1>
      <p class="reel-deck-text">A little wonder, one idea at a time. Swipe up to see where curiosity takes you.</p>
      <div class="reel-nav">
        ${arrow('prev', 'Previous idea')}${arrow('next', 'Next idea')}
        <span class="reel-position" data-position>Opening edition</span>
      </div>
      <div class="reel-side-links">
        <a href="#today">${icon('sun')} Today’s reading ${icon('arrow')}</a>
        <a href="#review">${icon('review')} Review <span data-reel-due></span>${icon('arrow')}</a>
      </div>
      <p class="reel-hint">SCROLL OR USE <kbd>↑</kbd> <kbd>↓</kbd></p>
    </aside>
    <div class="reel-device">
      <div class="reel-track" tabindex="0" aria-label="Swipe through ideas">${blank}</div>
    </div>
  </section>`;
  const track = root.querySelector('.reel-track');
  const sheet = document.querySelector('#reel-sheet');
  const cards = [];
  const entries = [];
  const seen = new Set();
  const beats = new Map(sameDay ? resume.beats : []);
  const clips = new Map();
  let index = 0;
  let active;
  let batch = sameDay ? resume.batch : 0;
  let stopped = false;
  let initialized = false;
  let request;
  let clipRequest;
  let activeClipRequest;
  let clipTimer;
  let emptyBatches = 0;
  let paused = sameDay ? resume.paused : motion.matches;
  let elapsed = 0;
  let frame = 0;
  let lastScroll = -1000;
  let lastTick = performance.now();
  let initialLoad;

  function reel(card, position, isDaily) {
    const story = storyFor(card);
    const clip = featuredClip(card);
    const actionButton = (action, label, symbol, text) =>
      '<button type="button" class="reel-tool reel-labeled" data-swipe="' + action
      + '" aria-pressed="false" aria-label="' + label + '" data-' + action + '-state>'
      + icon(symbol) + '<span>' + text + '</span></button>';
    const element = document.createElement('article');
    element.className = 'reel';
    element.dataset.accent = story.accent;
    element.setAttribute('aria-label', story.title);
    element.inert = true;
    element.innerHTML = `<div class="reel-top">
      <div class="reel-steps" aria-label="Scenes">
        ${story.beats.map((_, i) => `<button type="button" aria-label="Scene ${i + 1}" data-scene="${i}"><span></span></button>`).join('')}
      </div>
      <div class="reel-meta"><span class="reel-pill">${isDaily ? icon('sun') + ' DAILY IDEA' : esc(TOPICS[card.topic])}</span>
        <span class="reel-format">${clip ? 'SOURCE CLIP' : card.id.startsWith('simple-wiki-') ? 'FIELD NOTE' : 'MINI EXPLAINER'}</span>
        ${story.beats.length > 1 ? button('pause', 'Pause scenes', 'pause', 'data-pause') : ''}
      </div>
    </div>
    <div class="reel-art" data-art></div>
    <div class="reel-copy">
      <p class="reel-kicker" data-kicker></p>
      <h2>${esc(story.title)}</h2>
      <p class="reel-caption" data-caption></p>
      <div class="reel-buttons">
        ${story.beats.length > 1 ? '<button class="reel-primary" type="button" data-swipe="beat" data-beat></button>' : ''}
        ${clip ? '<button class="reel-text-button" type="button" data-swipe="clip">' + icon('play') + ' Watch clip</button>' : ''}
        <button class="reel-text-button" type="button" data-swipe="read">${icon('library')} Read</button>
      </div>
    </div>
    <div class="reel-footer">
      ${actionButton('save', 'Save idea', 'bookmark', 'Save')}
      ${actionButton('learn', 'Mark as learned', 'check', 'Learn')}
      <span class="reel-card-number">${position ? 'IDEA <strong>' + String(position + 1).padStart(2, '0') + '</strong>' : 'SWIPE UP'}</span>
      ${arrow('next', 'Next idea')}
    </div>`;
    const entry = { element, card, story, clip, position, seen: false };
    paint(entry, Math.min(beats.get(card.id) || 0, story.beats.length - 1));
    return entry;
  }

  function checkpoint(previous) {
    const element = document.createElement('article');
    element.className = 'reel reel-checkpoint';
    element.dataset.accent = 'mint';
    element.inert = true;
    element.setAttribute('aria-label', 'Quick recall checkpoint');
    element.innerHTML = `<div class="reel-top"><p class="reel-pill">${icon('review')} A QUICK PAUSE</p></div>
      <div class="reel-art">${storyArt('lens', 1)}</div>
      <div class="reel-copy"><p class="reel-kicker">FIVE IDEAS IN</p><h2>What stuck?</h2>
        <p class="reel-caption">${esc(previous.prompt)}</p>
        <p class="reel-answer" data-check-answer hidden>${esc(previous.answer)}</p>
        <div class="reel-buttons">
          <button type="button" class="reel-primary" data-swipe="checkpoint" aria-expanded="false">Reveal answer ${icon('spark')}</button>
          <button type="button" class="reel-text-button" data-swipe="next">Keep swiping ${icon('down')}</button>
        </div>
      </div>`;
    return { element };
  }

  function append(incoming, daily) {
    const fragment = document.createDocumentFragment();
    for (const card of incoming) {
      if (seen.has(card.id) || seen.has(cardKey(card)) || cards.length >= MAX_DECK) continue;
      seen.add(card.id);
      seen.add(cardKey(card));
      seen.add(normalize(card.title));
      const item = reel(card, cards.length, card.id === daily?.id);
      cards.push(card);
      entries.push(item);
      fragment.append(item.element);
      if (cards.length % SET_SIZE === 0) {
        const pause = checkpoint(cards[cards.length - SET_SIZE + 1]);
        entries.push(pause);
        fragment.append(pause.element);
      }
    }
    track.querySelector('.reel-loading')?.remove();
    const end = track.querySelector('.reel-end');
    track.insertBefore(fragment, end || null);
    if (end && cards.length < MAX_DECK && emptyBatches < 2) removeEnd();
  }

  function removeEnd() {
    const end = entries.at(-1);
    if (!end?.end) return;
    end.element.remove();
    entries.pop();
    if (index >= entries.length) activate(Math.max(0, entries.length - 1));
  }

  function addEnd() {
    if (entries.at(-1)?.end) return;
    const element = document.createElement('article');
    element.className = 'reel reel-end';
    element.dataset.accent = 'blue';
    element.inert = true;
    element.innerHTML = `<div class="reel-top"><p class="reel-pill">${icon('spark')} EXPLORATION BREAK</p></div>
      <div class="reel-art">${storyArt('orbit', 2)}</div>
      <div class="reel-copy"><h2>You made it through the stack.</h2>
      <p class="reel-caption" data-end-message>${cards.length >= MAX_DECK
        ? 'Start a fresh session another day or revisit what you kept.'
        : 'Check for more fresh ideas or revisit something you saved.'}</p>
      <div class="reel-buttons">
      ${cards.length < MAX_DECK ? '<button class="reel-primary" type="button" data-swipe="more">Find more ideas</button>' : ''}
      <a class="reel-text-button" href="#library">${icon('library')} Your library</a></div></div>`;
    entries.push({ element, end: true });
    track.append(element);
  }

  function paint(entry, beat) {
    const { card, element, story } = entry;
    const [label, text] = story.beats[beat];
    beats.set(card.id, beat);
    element.querySelector('[data-art]').innerHTML = storyArt(story.art, beat);
    element.querySelector('[data-kicker]').textContent = label;
    element.querySelector('[data-caption]').textContent = text;
    element.querySelectorAll('[data-scene]').forEach((segment, i) => {
      if (i === beat) segment.setAttribute('aria-current', 'step');
      else segment.removeAttribute('aria-current');
      segment.firstElementChild.style.width = i < beat ? '100%' : '0%';
    });
    const next = element.querySelector('[data-beat]');
    if (next) {
      const label = beat === story.beats.length - 1 ? 'Replay' : beat === 0 ? 'Reveal' : 'Next scene';
      next.innerHTML = label + ' ' + icon(label === 'Replay' ? 'review' : 'arrow');
    }
  }

  function reflect() {
    const due = getDue();
    root.querySelector('[data-reel-due]').textContent = due ? due + ' due' : '';
    root.querySelector('[data-position]').textContent = active?.card
      ? 'Idea ' + (active.position + 1) : !active ? 'Opening edition' : active.end ? 'End of the stack' : 'Quick recall';
    root.querySelector('.reel-nav [data-swipe="prev"]').disabled = index === 0;
    root.querySelector('.reel-nav [data-swipe="next"]').disabled = !active || index === entries.length - 1;
    if (!active?.card) return;
    const record = getRecord(active.card.id);
    const save = active.element.querySelector('[data-save-state]');
    const learn = active.element.querySelector('[data-learn-state]');
    const pause = active.element.querySelector('[data-pause]');
    save.setAttribute('aria-pressed', String(!!record?.saved));
    save.setAttribute('aria-label', record?.saved ? 'Remove saved idea' : 'Save idea');
    save.title = record?.saved ? 'Remove saved idea' : 'Save idea';
    save.querySelector('span').textContent = record?.saved ? 'Saved' : 'Save';
    learn.setAttribute('aria-pressed', String(!!record?.learned));
    learn.setAttribute('aria-label', record?.learned ? 'Learned' : 'Mark as learned');
    learn.title = record?.learned ? 'Learned' : 'Mark as learned';
    learn.querySelector('span').textContent = record?.learned ? 'Learned' : 'Learn';
    learn.disabled = !!record?.learned;
    if (pause) {
      pause.innerHTML = icon(paused ? 'play' : 'pause');
      pause.setAttribute('aria-label', paused ? 'Play scenes' : 'Pause scenes');
      pause.title = paused ? 'Play scenes' : 'Pause scenes';
    }
  }

  function activate(next) {
    const entry = entries[next];
    if (!entry || entry === active) return;
    clearTimeout(clipTimer);
    activeClipRequest?.abort();
    if (active) {
      active.element.classList.remove('is-active');
      active.element.inert = true;
    }
    active = entry;
    index = next;
    elapsed = 0;
    entry.element.inert = false;
    entry.element.classList.add('is-active');
    reflect();
    if (entry.card && !entry.clip && canFindClip(entry.card)) {
      clipTimer = setTimeout(() => { void lookForClip(entry); }, 1300);
    }
    if (cards.length - (entry.position ?? index) <= 5 && cards.length < MAX_DECK && emptyBatches < 2) {
      void more();
    }
    if (index >= entries.length - 2 && !request && (emptyBatches >= 2 || cards.length >= MAX_DECK)) addEnd();
  }

  function move(delta) {
    const next = index + delta;
    if (next < 0) return;
    if (next >= entries.length) {
      if (cards.length >= MAX_DECK || emptyBatches >= 2 || !navigator.onLine) {
        addEnd();
      } else {
        void more(true);
        return;
      }
    }
    if (entries[next]) track.scrollTo({ top: entries[next].element.offsetTop, behavior: motion.matches ? 'instant' : 'smooth' });
  }

  function onScroll() {
    lastScroll = performance.now();
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (track.clientHeight) activate(Math.min(entries.length - 1, Math.round(track.scrollTop / track.clientHeight)));
    });
  }

  const resize = new ResizeObserver(() => {
    if (active) track.scrollTop = active.element.offsetTop;
  });
  resize.observe(track);
  track.addEventListener('scroll', onScroll, { passive: true });

  async function more(explicit = false) {
    if (stopped || request || cards.length >= MAX_DECK) return;
    if (!navigator.onLine) {
      emptyBatches = 2;
      if (explicit || index >= entries.length - 2) addEnd();
      const note = active?.element.querySelector('[data-end-message]');
      if (note) note.textContent = 'You’re offline. Reconnect to pull in more ideas.';
      reflect();
      return;
    }
    const controller = new AbortController();
    request = controller;
    const timer = setTimeout(() => controller.abort(), 8000);
    const note = active?.element.querySelector('[data-end-message]');
    const trigger = active?.element.querySelector('[data-swipe="more"]');
    if (note) note.textContent = 'Looking for fresh ideas…';
    if (trigger) trigger.disabled = true;
    try {
      const next = await exploreIdeas({ day, batch: batch++, seen, signal: controller.signal });
      if (stopped) return;
      const before = cards.length;
      const leavingEnd = !!active?.end;
      const nextIndex = index;
      if (next.length) {
        removeEnd();
        append(next);
        onPool(next);
      }
      emptyBatches = cards.length > before ? 0 : emptyBatches + 1;
      if ((leavingEnd || explicit) && cards.length > before) {
        const target = leavingEnd ? nextIndex : nextIndex + 1;
        const entry = entries[target];
        if (entry) {
          track.scrollTop = entry.element.offsetTop;
          activate(target);
        }
      }
      if (explicit && cards.length === before && note) note.textContent = 'No new ideas came back this time. Try again in a moment.';
    } catch {
      emptyBatches++;
      if (note) note.textContent = 'The source is taking a break. Try again in a moment.';
    } finally {
      clearTimeout(timer);
      request = null;
      if (!stopped) {
        if ((index >= entries.length - 2 && emptyBatches >= 2) || (explicit && !entries[index + 1])) addEnd();
        if (trigger) trigger.disabled = false;
        reflect();
      }
    }
  }

  function offerClip(entry, clip) {
    if (entry.clip) return;
    entry.clip = clip;
    entry.element.querySelector('.reel-format').textContent = 'SOURCE CLIP';
    const read = entry.element.querySelector('[data-swipe="read"]');
    read.insertAdjacentHTML('beforebegin', '<button class="reel-text-button" type="button" data-swipe="clip">'
      + icon('play') + ' Watch clip</button>');
  }

  async function lookForClip(entry) {
    if (!navigator.onLine || active !== entry || sheet.open || stopped) return;
    const { card } = entry;
    if (clips.has(card.id)) {
      const known = clips.get(card.id);
      if (known) offerClip(entry, known);
      return;
    }
    const controller = new AbortController();
    activeClipRequest = controller;
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const clip = await discoverClip(card, controller.signal);
      if (!stopped && !controller.signal.aborted) {
        clips.set(card.id, clip);
        if (clip) offerClip(entry, clip);
      }
    } catch {
      // The reading can still be opened even when source media is unavailable.
    } finally {
      clearTimeout(timer);
      if (activeClipRequest === controller) activeClipRequest = null;
    }
  }

  function nextScene(entry, target) {
    elapsed = 0;
    paint(entry, target);
  }

  function tick(now) {
    const duration = Math.min(500, now - lastTick);
    lastTick = now;
    if (!active?.card || paused || document.hidden || sheet.open || now - lastScroll < 200) return;
    const beat = beats.get(active.card.id) || 0;
    const total = beatSeconds(active.story.beats[beat][1]) * 1000;
    elapsed = Math.min(elapsed + duration, total);
    const fill = active.element.querySelector('[data-scene="' + beat + '"] span');
    fill.style.width = Math.min(100, elapsed / total * 100) + '%';
    if (elapsed >= total && beat < active.story.beats.length - 1) nextScene(active, beat + 1);
  }

  function clipMarkup(clip) {
    const licensing = clip.licenseUrl
      ? `<a href="${esc(clip.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(clip.license)}</a>`
      : esc(clip.license);
    return `<video class="reel-video" playsinline controls preload="none" aria-label="${esc(clip.title)}"></video>
      <p class="reel-credit">Video by ${esc(clip.credit)} · ${licensing} ·
      <a href="${esc(clip.page)}" target="_blank" rel="noopener noreferrer">Original clip ${icon('external')}</a></p>
      <p class="reel-video-message" role="status"></p>`;
  }

  function attachClip(clip, play) {
    const media = sheet.querySelector('[data-reel-media]');
    media.innerHTML = clipMarkup(clip);
    const video = media.querySelector('video');
    const message = media.querySelector('.reel-video-message');
    video.addEventListener('error', () => {
      message.textContent = 'This clip could not play here. Open the original clip above or keep reading.';
    });
    if (clip.previewEnd) {
      video.addEventListener('loadedmetadata', () => {
        if (video.duration > clip.previewEnd) message.textContent = 'Showing a short preview. The original clip has the full version.';
      });
      video.addEventListener('timeupdate', () => {
        if (video.currentTime < clip.previewEnd) return;
        video.pause();
        video.currentTime = 0;
      });
    }
    video.src = clip.url;
    if (play) void video.play().catch(() => {
      if (video.error) return;
      message.textContent = 'Tap play to start the clip.';
    });
  }

  function openSheet(entry, play) {
    const { card, story } = entry;
    const clip = entry.clip || clips.get(card.id);
    const words = card.intro.trim().split(/\s+/).length;
    const cclink = card.id.startsWith('simple-wiki-')
      ? ' · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>' : '';
    sheet.dataset.idea = card.id;
    sheet.innerHTML = `<div class="dialog-top"><p class="eyebrow">${esc(TOPICS[card.topic])} · ${Math.max(1, Math.ceil(words/130))} MIN READ</p>
      <button type="button" class="icon-button" data-swipe="close" aria-label="Close idea" autofocus>${icon('close')}</button></div>
      <h2 id="reel-sheet-title">${esc(story.title)}</h2>
      <div data-reel-media>
        ${!clip && canFindClip(card) ? '<button type="button" class="button" data-swipe="find-clip">' + icon('film') + ' Find a source clip</button><p class="reel-video-message" role="status"></p>' : ''}
      </div>
      <p class="concept">${esc(card.kicker)}</p><p class="idea-text">${esc(card.intro)}</p>
      ${card.example ? '<div class="example">' + icon('spark') + '<span><strong>Try it.</strong> ' + esc(card.example) + '</span></div>' : ''}
      <p class="source-line">${esc(card.source.byline)} · <a href="${esc(card.source.url)}" target="_blank" rel="noopener noreferrer">${esc(card.source.title)} ${icon('external')}</a>${cclink}</p>
      <div class="button-row">
        ${'speechSynthesis' in window ? '<button type="button" class="button" data-swipe="listen">' + icon('volume') + ' Listen</button>' : ''}
        <button type="button" class="button primary" data-swipe="learn-sheet"></button>
        <button type="button" class="button" data-swipe="save-sheet" aria-pressed="false"></button>
      </div>`;
    activeClipRequest?.abort();
    sheet.showModal();
    refreshSheet(card);
    if (clip) attachClip(clip, play);
  }

  function refreshSheet(card) {
    if (!sheet.open) return;
    const record = getRecord(card.id);
    const learn = sheet.querySelector('[data-swipe="learn-sheet"]');
    const save = sheet.querySelector('[data-swipe="save-sheet"]');
    learn.disabled = !!record?.learned;
    learn.innerHTML = icon('check') + (record?.learned ? ' Learned' : ' Mark as learned');
    save.setAttribute('aria-pressed', String(!!record?.saved));
    save.innerHTML = icon('bookmark') + (record?.saved ? ' Saved' : ' Save idea');
  }

  async function findClip(card, control) {
    clipRequest?.abort();
    const controller = new AbortController();
    clipRequest = controller;
    const timer = setTimeout(() => controller.abort(), 7000);
    const status = sheet.querySelector('.reel-video-message');
    control.disabled = true;
    status.textContent = 'Checking the article’s media…';
    try {
      const clip = clips.has(card.id) ? clips.get(card.id) : await discoverClip(card, controller.signal);
      if (!sheet.open || sheet.dataset.idea !== card.id || stopped) return;
      if (!clip) {
        status.textContent = 'No matching, reusable clip was found for this idea.';
        return;
      }
      clips.set(card.id, clip);
      if (active?.card?.id === card.id) offerClip(active, clip);
      attachClip(clip, false);
    } catch {
      status.textContent = 'The clip source could not be reached. Try again in a moment.';
    } finally {
      clearTimeout(timer);
      if (clipRequest === controller) clipRequest = null;
      control.disabled = false;
    }
  }

  function speak(card, control) {
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
      control.innerHTML = icon('volume') + ' Listen';
      return;
    }
    const voice = new SpeechSynthesisUtterance(card.intro);
    voice.rate = .94;
    voice.lang = 'en';
    const reset = () => { control.innerHTML = icon('volume') + ' Listen'; };
    voice.onend = reset;
    voice.onerror = reset;
    control.innerHTML = icon('pause') + ' Stop listening';
    synth.speak(voice);
  }

  function closeSheet() {
    clipRequest?.abort();
    sheet.querySelector('video')?.pause();
    window.speechSynthesis?.cancel();
    sheet.replaceChildren();
  }

  async function handle(event) {
    const control = event.target.closest('button');
    if (!control || !active) return;
    const action = control.dataset.swipe;
    const entry = active;
    if (action === 'next' || action === 'prev') {
      move(action === 'next' ? 1 : -1);
      track.focus({ preventScroll: true });
    } else if (action === 'more') {
      void more(true);
    } else if (action === 'checkpoint') {
      entry.element.querySelector('[data-check-answer]').hidden = false;
      control.setAttribute('aria-expanded', 'true');
      control.hidden = true;
      entry.element.querySelector('[data-swipe="next"]').focus();
    } else if (entry.card) {
      const { card, story } = entry;
      if (control.hasAttribute('data-scene')) {
        nextScene(entry, Number(control.dataset.scene));
      } else if (action === 'beat') {
        nextScene(entry, ((beats.get(card.id) || 0) + 1) % story.beats.length);
      } else if (action === 'pause') {
        paused = !paused;
        reflect();
      } else if (action === 'read' || action === 'clip') {
        openSheet(entry, action === 'clip');
      } else if (action === 'close') {
        sheet.close();
      } else if (action === 'find-clip') {
        void findClip(card, control);
      } else if (action === 'listen') {
        speak(card, control);
      } else if (['save', 'learn', 'save-sheet', 'learn-sheet'].includes(action)) {
        await onAction(card, action.startsWith('save') ? 'save' : 'learn');
        if (stopped) return;
        reflect();
        refreshSheet(card);
      }
    }
  }

  function onKey(event) {
    if (sheet.open || event.altKey || event.metaKey || event.ctrlKey
      || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    move(event.key === 'ArrowDown' ? 1 : -1);
  }

  function onMotion() {
    paused = motion.matches;
    reflect();
  }

  root.addEventListener('click', handle);
  sheet.addEventListener('click', handle);
  sheet.addEventListener('close', closeSheet);
  document.addEventListener('keydown', onKey);
  motion.addEventListener?.('change', onMotion);
  const clock = setInterval(() => tick(performance.now()), 150);

  return {
    update(daily, pool, waiting) {
      if (!initialized && (daily || !waiting)) {
        initialized = true;
        append(sameDay ? resume.cards : openingCards(daily, pool, day), daily);
        const restored = sameDay ? Math.min(resume.index, entries.length - 1) : 0;
        if (entries[restored]) track.scrollTop = entries[restored].element.offsetTop;
        activate(restored);
        initialLoad = setTimeout(() => {
          if (!sameDay && cards.length < 20) void more();
        }, 1250);
      }
      reflect();
    },
    snapshot() {
      return { day, cards: [...cards], index, paused, beats: [...beats], batch };
    },
    destroy() {
      stopped = true;
      clearTimeout(initialLoad);
      clearTimeout(clipTimer);
      activeClipRequest?.abort();
      clearInterval(clock);
      cancelAnimationFrame(frame);
      request?.abort();
      resize.disconnect();
      track.removeEventListener('scroll', onScroll);
      root.removeEventListener('click', handle);
      document.removeEventListener('keydown', onKey);
      motion.removeEventListener?.('change', onMotion);
      if (sheet.open) sheet.close();
      closeSheet();
      sheet.removeEventListener('click', handle);
      sheet.removeEventListener('close', closeSheet);
    },
  };
}
