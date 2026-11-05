import { feedbackKey, rankCards } from './preferences.js?v=6';
import { TOPICS, normalize } from './learning.js?v=6';
import { exploreIdeas } from './feed.js?v=6';
import { storyArt } from './swipe-art.js?v=6';
import { beatSeconds, cardKey, openingCards, storyFor } from './swipe-stories.js?v=6';
import { canFindClip, discoverClip, featuredClip } from './swipe-media.js?v=6';
import { evidenceDetails } from './evidence.js?v=6';
import { lessonReading } from './lessons.js?v=6';

const SET_SIZE = 5;
const MAX_DECK = 120;

export function mountSwipe(root, options) {
  const { day, icon, escape: esc, onAction, onPool, getRecord, getRecords, onFeedback, getDue, resume } = options;
  const sameDay = resume?.day === day;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const button = (action, label, symbol, extra = '') =>
    `<button type="button" class="reel-tool" data-swipe="${action}" aria-label="${label}" title="${label}" ${extra}>${icon(symbol)}</button>`;
  const arrow = (direction, label) => button(direction, label, direction === 'prev' ? 'up' : 'down');
  const blank = '<div class="reel-loading" role="status">Opening the feed…</div>';
  root.innerHTML = `<section class="reel-layout" aria-label="Mind Expansion feed">
    <aside class="reel-intro">
      <p class="reel-eyebrow"><span></span> ONE IDEA, UNDERSTOOD</p>
      <h1>Good things<br>to know<span>.</span></h1>
      <p class="reel-deck-text">Book ideas you can use today. Conversations that go better. History and animal behavior worth knowing.</p>
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
  let inlinePlayer;
  let emptyBatches = 0;
  let paused = sameDay ? resume.paused : true;
  let elapsed = 0;
  let frame = 0;
  let lastScroll = -1000;
  let lastTick = performance.now();
  let initialLoad;
  let ratingSignature;
  let dailyCard;
  let latestPool = [];

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
      <div class="reel-steps" aria-label="Lesson sections">
        ${story.beats.map((_, i) => `<button type="button" aria-label="Section ${i + 1}: ${esc(story.beats[i][0])}" data-scene="${i}"><span></span></button>`).join('')}
      </div>
      <div class="reel-meta"><span class="reel-pill">${isDaily ? icon('sun') + ' DAILY IDEA' : esc(TOPICS[card.topic])}</span>
        <span class="reel-format">${card.id.startsWith('simple-wiki-') ? 'SOURCE LESSON' : 'SHORT LESSON'}</span>
        ${story.beats.length > 1 ? button('pause', 'Pause scenes', 'pause', 'data-pause') : ''}
      </div>
    </div>
    <div class="reel-art"><div class="reel-illustration" data-art></div>
      <div class="reel-inline" data-inline hidden></div></div>
    <div class="reel-copy">
      <p class="reel-origin" title="${esc(card.source.title + ' · ' + card.source.byline)}">${esc(card.kind === 'book' ? card.source.title : card.kicker)}</p>
      <p class="reel-section-number" data-section-number></p>
      <p class="reel-kicker" data-kicker></p>
      <h2>${esc(story.title)}</h2>
      <p class="reel-caption" data-caption></p>
      <p class="reel-remember" data-remember hidden></p>
      <div class="reel-buttons">
        ${story.beats.length > 1 ? '<button class="reel-primary" type="button" data-swipe="beat" data-beat></button>' : ''}
        ${clip ? playButton() : ''}
        <button class="reel-text-button" type="button" data-swipe="read">${icon('library')} Full lesson</button>
      </div>
    </div>
    <div class="reel-feedback" role="group" aria-label="Tune your feed">
      ${actionButton('like', 'Like: more like this', 'thumb-up', 'Like')}
      ${actionButton('dislike', 'Dislike: less like this', 'thumb-down', 'Dislike')}
      <span>Make this feed yours</span>
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

  function append(incoming, daily, ordered = false) {
    const fragment = document.createDocumentFragment();
    for (const card of ordered ? incoming : rankCards(incoming, getRecords())) {
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

  function rerankUpcoming() {
    if (!initialized || !active || !active.card) return;
    const signature = feedbackKey(getRecords());
    if (signature === ratingSignature) return;
    ratingSignature = signature;
    // Keep the current card and everything before it in place. Only rebuild the
    // unseen tail; this also makes undo able to restore a formerly hidden idea.
    const prefix = entries.slice(0, index + 1);
    const previousCards = prefix.filter(entry => entry.card).map(entry => entry.card);
    const previousIds = new Set(previousCards.map(card => card.id));
    const candidates = [...new Map([...cards, ...openingCards(dailyCard, latestPool, day)]
      .filter(card => !previousIds.has(card.id)).map(card => [card.id, card])).values()];
    const next = rankCards(candidates, getRecords()).slice(0, MAX_DECK - previousCards.length);
    entries.slice(index + 1).forEach(entry => entry.element.remove());
    entries.splice(index + 1);
    cards.splice(0, cards.length, ...previousCards);
    seen.clear();
    previousCards.forEach(card => {
      seen.add(card.id); seen.add(cardKey(card)); seen.add(normalize(card.title));
    });
    append(next, dailyCard, true);
    track.scrollTop = active.element.offsetTop;
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
    element.querySelector('[data-section-number]').textContent = (beat + 1) + ' OF ' + story.beats.length;
    element.querySelector('[data-caption]').textContent = text;
    element.querySelectorAll('[data-scene]').forEach((segment, i) => {
      if (i === beat) segment.setAttribute('aria-current', 'step');
      else segment.removeAttribute('aria-current');
      segment.firstElementChild.style.width = i < beat ? '100%' : '0%';
    });
    const last = beat === story.beats.length - 1;
    const remember = element.querySelector('[data-remember]');
    remember.hidden = !last || !card.lesson;
    remember.innerHTML = last && card.lesson ? '<strong>Remember</strong> ' + esc(card.lesson.takeaway) : '';
    const next = element.querySelector('[data-beat]');
    if (next) {
      next.innerHTML = (last ? 'Check understanding' : 'Continue') + ' ' + icon(last ? 'review' : 'arrow');
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
    for (const [action, value] of [['like', 1], ['dislike', -1]]) {
      const control = active.element.querySelector('[data-' + action + '-state]');
      const selected = record?.feedback === value;
      control.setAttribute('aria-pressed', String(selected));
      control.setAttribute('aria-label', selected ? 'Undo ' + action : action === 'like' ? 'Like: more like this' : 'Dislike: less like this');
      control.querySelector('span').textContent = selected ? (value === 1 ? 'Liked' : 'Disliked') : (value === 1 ? 'Like' : 'Dislike');
    }
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
      pause.setAttribute('aria-label', paused ? 'Auto-advance sections' : 'Pause sections');
      pause.title = paused ? 'Auto-advance sections' : 'Pause sections';
    }
  }

  function activate(next) {
    const entry = entries[next];
    if (!entry || entry === active) return;
    clearTimeout(clipTimer);
    activeClipRequest?.abort();
    releasePlayer();
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
    if (entry.clip) showPlayer(entry);
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
      const next = await exploreIdeas({ day, batch: batch++, seen, records: getRecords(), signal: controller.signal });
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

  function playButton() {
    return '<button class="reel-text-button" type="button" data-swipe="clip">'
      + icon('play') + ' Play clip</button>';
  }

  function offerClip(entry, clip) {
    if (entry.clip) return;
    entry.clip = clip;
    entry.element.querySelector('.reel-format').textContent = 'VIDEO ON CARD';
    const read = entry.element.querySelector('[data-swipe="read"]');
    read.insertAdjacentHTML('beforebegin', playButton());
    if (active === entry) showPlayer(entry);
  }

  function releasePlayer() {
    if (!inlinePlayer) return;
    const { entry, video, holder } = inlinePlayer;
    inlinePlayer = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
    holder.replaceChildren();
    holder.hidden = true;
    entry.element.classList.remove('has-inline-video');
  }

  function updatePlayer(player) {
    if (inlinePlayer !== player) return;
    const { entry, video, failed, finished } = player;
    const control = entry.element.querySelector('[data-swipe="clip"]');
    control.hidden = failed;
    if (failed) return;
    const text = video.paused ? (finished ? 'Replay clip' : 'Play clip') : 'Pause clip';
    control.innerHTML = icon(video.paused ? 'play' : 'pause') + ' ' + text;
  }

  function showPlayer(entry) {
    const { clip } = entry;
    if (!clip || inlinePlayer?.entry === entry) return;
    const holder = entry.element.querySelector('[data-inline]');
    holder.innerHTML = `<video class="reel-inline-video" playsinline muted controls
      preload="metadata" aria-label="${esc(clip.title)}"></video>
      <a class="reel-inline-credit" href="${esc(clip.page)}" target="_blank" rel="noopener noreferrer"
      title="${esc(clip.credit)}">${esc(clip.credit)} ${icon('external')}</a>
      <p class="reel-inline-status" role="status"></p>`;
    const video = holder.querySelector('video');
    const status = holder.querySelector('[role="status"]');
    const player = { entry, holder, video, finished: false, failed: false };
    inlinePlayer = player;
    holder.hidden = false;
    video.defaultMuted = true;
    video.muted = true;
    video.addEventListener('loadeddata', () => {
      if (inlinePlayer === player) entry.element.classList.add('has-inline-video');
    });
    for (const type of ['play', 'pause']) video.addEventListener(type, () => updatePlayer(player));
    video.addEventListener('ended', () => {
      player.finished = true;
      updatePlayer(player);
    });
    if (clip.previewEnd) video.addEventListener('timeupdate', () => {
      if (video.currentTime < clip.previewEnd || video.paused) return;
      player.finished = true;
      video.pause();
    });
    video.addEventListener('error', () => {
      if (inlinePlayer !== player) return;
      player.failed = true;
      entry.element.classList.remove('has-inline-video');
      status.innerHTML = 'Clip unavailable. <a href="' + esc(clip.page)
        + '" target="_blank" rel="noopener noreferrer">Open original</a>';
      updatePlayer(player);
    });
    video.src = clip.url;
    if (!motion.matches && !document.hidden && !sheet.open
      && !navigator.connection?.saveData && (clip.local || navigator.onLine)) {
      void video.play().catch(() => {});
    }
    updatePlayer(player);
  }

  function toggleClip(entry) {
    showPlayer(entry);
    if (!inlinePlayer || inlinePlayer.failed) return;
    const { video } = inlinePlayer;
    if (!video.paused) {
      video.pause();
      return;
    }
    if (inlinePlayer.finished) {
      video.currentTime = 0;
      inlinePlayer.finished = false;
    }
    void video.play().catch(() => {});
  }

  function pauseHiddenPlayer() {
    if (document.hidden) inlinePlayer?.video.pause();
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

  function clipCredit(clip) {
    const licensing = clip.licenseUrl
      ? `<a href="${esc(clip.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(clip.license)}</a>`
      : esc(clip.license);
    return `<p class="reel-credit">Video by ${esc(clip.credit)} · ${licensing} ·
      <a href="${esc(clip.page)}" target="_blank" rel="noopener noreferrer">Original clip ${icon('external')}</a>
      ${clip.note ? '<br>' + esc(clip.note) : ''}</p>`;
  }

  function openSheet(entry) {
    const { card, story } = entry;
    const clip = entry.clip || clips.get(card.id);
    const words = card.intro.trim().split(/\s+/).length;
    const cclink = card.id.startsWith('simple-wiki-')
      ? ' · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>' : '';
    inlinePlayer?.video.pause();
    sheet.dataset.idea = card.id;
    sheet.innerHTML = `<div class="dialog-top"><p class="eyebrow">${esc(TOPICS[card.topic])} · ${Math.max(1, Math.ceil(words/130))} MIN READ</p>
      <button type="button" class="icon-button" data-swipe="close" aria-label="Close idea" autofocus>${icon('close')}</button></div>
      <h2 id="reel-sheet-title">${esc(story.title)}</h2>
      <div data-reel-media>
        ${clip ? clipCredit(clip) : canFindClip(card) ? '<button type="button" class="button" data-swipe="find-clip">' + icon('film') + ' Find a source clip</button><p class="reel-video-message" role="status"></p>' : ''}
      </div>
      <p class="concept">${esc(card.kicker)}</p>${lessonReading(card, esc)}
      ${card.example ? '<div class="example">' + icon('spark') + '<span><strong>Try it.</strong> ' + esc(card.example) + '</span></div>' : ''}
      <p class="source-line">${esc(card.source.byline)} · <a href="${esc(card.source.url)}" target="_blank" rel="noopener noreferrer">${esc(card.source.title)} ${icon('external')}</a>${cclink}</p>
      ${evidenceDetails(card, esc)}
      <div class="button-row">
        ${'speechSynthesis' in window ? '<button type="button" class="button" data-swipe="listen">' + icon('volume') + ' Listen</button>' : ''}
        <button type="button" class="button primary" data-swipe="learn-sheet"></button>
        <button type="button" class="button" data-swipe="save-sheet" aria-pressed="false"></button>
      </div>`;
    activeClipRequest?.abort();
    if (!sheet.open) sheet.showModal();
    refreshSheet(card);
  }

  function openCheck(entry) {
    const { card } = entry;
    inlinePlayer?.video.pause();
    sheet.dataset.idea = card.id;
    sheet.innerHTML = `<div class="dialog-top"><p class="eyebrow">CHECK YOUR UNDERSTANDING</p>
      <button type="button" class="icon-button" data-swipe="close" aria-label="Close check" autofocus>${icon('close')}</button></div>
      <h2 id="reel-sheet-title">${esc(card.prompt)}</h2>
      <p class="idea-text">Explain it in your own words before comparing with the answer.</p>
      <div class="button-row"><button type="button" class="button primary" data-swipe="check-answer">Compare answer</button></div>
      <div class="lesson-check-answer" data-lesson-answer hidden><p>${esc(card.answer)}</p></div>
      <div class="button-row" data-check-actions hidden>
        <button type="button" class="button primary" data-swipe="learn-sheet"></button>
        <button type="button" class="button" data-swipe="save-sheet" aria-pressed="false"></button>
        <button type="button" class="button" data-swipe="read">Read the lesson again</button>
      </div>`;
    if (!sheet.open) sheet.showModal();
    refreshSheet(card);
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
      sheet.querySelector('[data-reel-media]').innerHTML = clipCredit(clip)
        + '<p class="reel-video-message" role="status">Clip added to the feed card.</p>';
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
        const current = beats.get(card.id) || 0;
        if (current === story.beats.length - 1) openCheck(entry);
        else nextScene(entry, current + 1);
      } else if (action === 'like' || action === 'dislike') {
        control.disabled = true;
        const value = action === 'like' ? 1 : -1;
        try {
          await onFeedback(card, getRecord(card.id)?.feedback === value ? 0 : value);
          if (!stopped) { rerankUpcoming(); reflect(); }
        } finally { control.disabled = false; }
      } else if (action === 'pause') {
        paused = !paused;
        if (paused) inlinePlayer?.video.pause();
        reflect();
      } else if (action === 'check-answer') {
        sheet.querySelector('[data-lesson-answer]').hidden = false;
        sheet.querySelector('[data-check-actions]').hidden = false;
        control.hidden = true;
        sheet.querySelector('[data-swipe="learn-sheet"]').focus();
      } else if (action === 'read') {
        openSheet(entry);
      } else if (action === 'clip') {
        toggleClip(entry);
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
  document.addEventListener('visibilitychange', pauseHiddenPlayer);
  motion.addEventListener?.('change', onMotion);
  const clock = setInterval(() => tick(performance.now()), 150);

  return {
    update(daily, pool, waiting) {
      dailyCard = daily;
      latestPool = pool;
      if (!initialized && (daily || !waiting)) {
        initialized = true;
        append(sameDay ? resume.cards : openingCards(daily, pool, day, getRecords()), daily, true);
        ratingSignature = sameDay ? null : feedbackKey(getRecords());
        const restored = sameDay ? Math.min(resume.index, entries.length - 1) : 0;
        if (entries[restored]) track.scrollTop = entries[restored].element.offsetTop;
        activate(restored);
        initialLoad = setTimeout(() => {
          if (!sameDay && cards.length < 20) void more();
        }, 1250);
      }
      rerankUpcoming();
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
      document.removeEventListener('visibilitychange', pauseHiddenPlayer);
      releasePlayer();
      motion.removeEventListener?.('change', onMotion);
      if (sheet.open) sheet.close();
      closeSheet();
      sheet.removeEventListener('click', handle);
      sheet.removeEventListener('close', closeSheet);
    },
  };
}
