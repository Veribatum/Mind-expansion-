import {
  TOPICS, addDays, dayKey, dayNumber, decodeState, dueRecords, learn, matches, mergeState,
  newRecord, newState, rate, reviewDate, validCard,
} from './learning.js?v=5';
import { selectIdea } from './feed.js?v=5';
import { mountSwipe } from './swipe.js?v=5';
import { evidenceDetails } from './evidence.js?v=5';
import { authoredLesson, lessonReading, upgradeLessonState } from './lessons.js?v=5';
import { openLibrary, onLocalChange, readLocalState, writeLocalState } from './storage.js?v=5';

const ROUTES = ['feed', 'today', 'review', 'library', 'settings'];
const KINDS = { book: 'Book insight', research: 'Research insight', essay: 'Field note', encyclopedia: 'Encyclopedia' };
const app = document.querySelector('#app');
const main = document.querySelector('#main');
const dialog = document.querySelector('#detail');
const notice = document.querySelector('#notice');
let storageOK = true;
let state = newState();
let library;
let pool = [];
let channel;
let limit = 30;
let today = dayKey();
let pendingDay = '';
let attemptedDay = '';
let route = currentRoute();
let filter = 'all';
let search = '';
let revealed = '';
let practiceId = '';
let noticeTimer;
let swipe;
let swipeDay;
let swipeResume;

async function saveChanges(changes) {
  try {
    if (library) {
      const written = await library.write(changes);
      state = mergeState(state, written);
      Object.assign(state.days, written.days);
      channel?.postMessage(written);
    } else {
      state = mergeState(readLocalState(), state);
      writeLocalState(state);
    }
    storageOK = true;
  } catch {
    storageOK = false;
    say('Changes are still open here. Export a backup to keep them.');
  }
}

async function updateRecord(card, update) {
  const prior = state.records[card.id] || newRecord(card);
  const result = update(prior);
  if (prior === result) return;
  state.records[card.id] = result;
  await saveChanges({ records: { [card.id]: result }, days: {} });
}

function acceptUpdates(incoming) {
  state = upgradeLessonState(mergeState({ ...state, days: { ...state.days, ...incoming.days } }, incoming));
  if (!dialog.open && document.activeElement?.id !== 'search') render();
}

function currentRoute() {
  const hash = location.hash.slice(1);
  return ROUTES.includes(hash) ? hash : 'feed';
}

function go(view) {
  if (location.hash === '#' + view) render();
  else location.hash = view;
}

function say(message) {
  window.clearTimeout(noticeTimer);
  notice.textContent = message;
  noticeTimer = window.setTimeout(() => { notice.textContent = ''; }, 4200);
}

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function icon(name) {
  return '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
}

function heading(eyebrow, title, subtitle, extra = '') {
  return `<header class="page-heading"><div>
    <p class="eyebrow">${eyebrow}</p><h1>${title}<span class="heading-dot">.</span></h1>
    <p class="subheading">${subtitle}</p></div>${extra}</header>`;
}

function art(card) {
  const pattern = {
    practice: { rx: 58, tilt: 34, figure: '01', dot: [190, 101], name: 'RECALL / PRACTICE' },
    mind: { rx: 49, tilt: 53, figure: '02', dot: [204, 117], name: 'MIND / BEHAVIOR' },
    thinking: { rx: 76, tilt: 24, figure: '03', dot: [190, 101], name: 'LOGIC / JUDGMENT' },
    systems: { rx: 42, tilt: 66, figure: '04', dot: [204, 117], name: 'SYSTEMS / SOCIETY' },
    science: { rx: 65, tilt: 43, figure: '05', dot: [190, 101], name: 'SCIENCE / NATURE' },
  }[card.topic];
  return `<div class="hero-art" aria-hidden="true">
    <div class="art-top"><span>MIND EXPANSION</span><span>FIG. ${pattern.figure}</span></div>
    <svg viewBox="0 0 320 330" fill="none">
      <defs>
        <pattern id="chart-grid" width="19" height="19" patternUnits="userSpaceOnUse">
          <path d="M19 0H0V19" stroke="currentColor" stroke-width=".6" opacity=".23"/>
        </pattern>
        <radialGradient id="art-glow"><stop stop-color="var(--art-wash)"/><stop offset="1" stop-color="var(--art)"/></radialGradient>
      </defs>
      <circle cx="160" cy="165" r="153" fill="url(#art-glow)"/>
      <rect x="17" y="22" width="286" height="286" fill="url(#chart-grid)"/>
      <g stroke="currentColor">
        <path d="M25 165h270M160 30v270" opacity=".39" stroke-dasharray="3 5"/>
        <circle cx="160" cy="165" r="117" opacity=".46" stroke-dasharray="1.6 4.2"/>
        <circle cx="160" cy="165" r="97" opacity=".7"/>
        <circle cx="160" cy="165" r="44" opacity=".3"/>
        <ellipse cx="160" cy="165" rx="${pattern.rx}" ry="108" transform="rotate(${pattern.tilt} 160 165)"/>
        <ellipse cx="160" cy="165" rx="${pattern.rx}" ry="108" transform="rotate(-${pattern.tilt} 160 165)"/>
        <ellipse cx="160" cy="165" rx="107" ry="39" transform="rotate(-18 160 165)" opacity=".6"/>
        <path d="M30 43h13m-6-7v14m241 228h13m-6-6v12M250 76h13m-6-6v12M58 254h13m-6-6v12" opacity=".63"/>
      </g>
      <circle cx="160" cy="165" r="10" fill="var(--art-pop)"/>
      <circle cx="160" cy="165" r="17" stroke="var(--art-pop)" opacity=".64"/>
      <circle cx="${pattern.dot[0]}" cy="${pattern.dot[1]}" r="4" fill="var(--art-pop)"/>
      <circle cx="81" cy="191" r="3.4" fill="currentColor"/>
      <circle cx="228" cy="228" r="3.4" fill="currentColor"/>
    </svg>
    <div class="art-bottom"><span>FIELD STUDIES</span><span>${pattern.name}</span></div>
  </div>`;
}

function cardMeta(card) {
  const minutes = Math.max(1, Math.ceil((card.intro + ' ' + card.example).split(/\s+/).length / 130));
  return `<div class="card-meta"><span class="pill">${TOPICS[card.topic]}</span>
    <span class="readtime">${icon('clock')} ${minutes} min read</span></div>`;
}

function sourceLine(card) {
  const license = card.id.startsWith('simple-wiki-')
    ? ' · <a class="license" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>'
    : '';
  return `<div class="source-line"><span>${KINDS[card.kind]} · ${escape(card.source.byline)}</span>
    <span aria-hidden="true">·</span><a href="${escape(card.source.url)}" target="_blank" rel="noopener noreferrer"
    aria-label="Open source: ${escape(card.source.title)}">${escape(card.source.title)} ${icon('external')}</a>${license}</div>`;
}

function reading(card) {
  card = authoredLesson(card);
  return `<p class="concept">${escape(card.kicker)}</p>
    ${lessonReading(card, escape)}
    ${card.example ? `<div class="example">${icon('spark')}<span><strong>Try it.</strong> ${escape(card.example)}</span></div>` : ''}
    ${sourceLine(card)}${evidenceDetails(card, escape)}`;
}

function saveButton(card, record) {
  const saved = !!record?.saved;
  return `<button type="button" class="button" data-save="${card.id}" aria-pressed="${saved}">
    ${icon('bookmark')} ${saved ? 'Saved' : 'Save idea'}</button>`;
}

function stat(href, symbol, title, summary) {
  return `<a class="stat" href="#${href}"><span class="stat-icon">${icon(symbol)}</span>
    <span><strong>${title}</strong><small>${summary}</small></span>${icon('arrow')}</a>`;
}

function todayView() {
  const date = new Date(today + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const top = heading('The daily edition', 'Today’s idea', 'A few minutes to learn something that sticks.',
    `<time class="date-stamp" datetime="${today}">${escape(date)}</time>`);
  const card = state.days[today];
  const due = dueRecords(state, today).length;
  const learned = Object.values(state.records).filter(record => record.learned).length;
  const dashboard = `<section class="dashboard" aria-label="Your learning">
    ${stat('feed', 'feed', 'Swipe through ideas', 'Animal research, mysteries and more')}
    ${stat('review', 'review', due ? `${due} due for review` : 'Review queue', due ? 'Try a quick recall' : 'You’re caught up')}
    ${stat('library', 'library', 'Your library', `${learned} ${learned === 1 ? 'idea' : 'ideas'} learned`)}
    </section>`;
  if (!card) {
    return top + (pendingDay === today || attemptedDay !== today
      ? '<div class="panel loading" role="status">Finding an idea for today…</div>'
      : '<div class="panel"><h2>Today’s source is taking a break.</h2><p>Your saved ideas and reviews are still here. Reconnect and try again for a new idea.</p><div class="button-row"><button type="button" class="button primary" data-retry>Try again</button></div></div>')
      + dashboard;
  }
  const record = state.records[card.id];
  const action = record?.learned
    ? `<span class="button completed">${icon('check')} Learned</span>
       <button type="button" class="button linklike" data-practice="${card.id}">Quick recall ${icon('arrow')}</button>`
    : `<button type="button" class="button primary" data-learn="${card.id}">${icon('check')} Mark as learned</button>`;
  return top + `<article class="hero" data-topic="${card.topic}" aria-labelledby="daily-title">
    <div class="hero-copy">${cardMeta(card)}<h2 id="daily-title">${escape(card.title)}</h2>${reading(card)}
    <div class="button-row">${action}${saveButton(card, record)}</div></div>${art(card)}</article>` + dashboard;
}

function reviewView() {
  const top = heading('Spaced recall', 'Review', 'Give what you learned a chance to come back.');
  const due = dueRecords(state, today);
  const practice = practiceId ? state.records[practiceId] : null;
  const record = practice || due[0];
  if (!record) {
    const next = Object.values(state.records).map(item => item.due).filter(Boolean).sort()[0];
    return top + `<section class="panel review-panel"><p class="eyebrow">All clear</p><h2>You’re caught up.</h2>
      <p>${next ? `Your next review is due ${escape(reviewDate(next))}.` : 'Mark an idea as learned and your first review will appear here tomorrow.'}</p>
      <div class="button-row"><a class="button primary" href="#today">Go to today ${icon('arrow')}</a></div></section>`;
  }
  const card = record.card;
  const showAnswer = revealed === card.id;
  const onSchedule = record.due <= today;
  const controls = !showAnswer
    ? `<button type="button" class="button primary" data-reveal="${card.id}">Reveal answer ${icon('arrow')}</button>`
    : onSchedule
      ? `<button type="button" class="button" data-rate="again" data-id="${card.id}">Again tomorrow</button>
         <button type="button" class="button primary" data-rate="got-it" data-id="${card.id}">${icon('check')} Got it</button>`
      : '<button type="button" class="button primary" data-end-practice>Done</button>';
  return top + `<section class="panel review-panel"><p class="eyebrow">${onSchedule ? 'Due now' : 'Quick practice'} · ${TOPICS[card.topic]}</p>
    <h2>${escape(card.prompt)}</h2><p>Try saying the answer or thinking it through before you reveal it.</p>
    ${showAnswer ? `<div class="review-answer" tabindex="-1"><p class="eyebrow">The answer</p><p>${escape(card.answer)}</p></div>` : ''}
    <div class="button-row">${controls}${practice ? '<button type="button" class="button linklike" data-end-practice>Back to today</button>' : ''}</div>
    <div class="review-count">${icon('review')} ${onSchedule ? `${due.length} ${due.length === 1 ? 'idea' : 'ideas'} due` : `Next scheduled review ${escape(reviewDate(record.due))}`}</div>
    </section>`;
}

function libraryResults() {
  const records = Object.values(state.records).filter(record => record.learned || record.saved);
  const items = records.filter(record => (filter === 'all' || record[filter]) && matches(record, search))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  if (!items.length) {
    const emptyLibrary = !records.length;
    return `<section class="panel"><h2>${emptyLibrary ? 'Your shelf is empty.' : 'No matching ideas.'}</h2>
      <p>${emptyLibrary ? 'Learn or save an idea and it’ll be here when you want to find it again.'
        : 'Try a different keyword or change the filter.'}</p>
      ${emptyLibrary ? '<div class="button-row"><a class="button primary" href="#today">See today’s idea</a></div>' : ''}</section>`;
  }
  return `<p class="library-count">${items.length} ${items.length === 1 ? 'idea' : 'ideas'}</p>
    <div class="library-list">${items.slice(0, limit).map(({ card, learned, saved }) =>
      `<button type="button" class="library-item" data-detail="${card.id}">
        <span><strong>${escape(card.title)}</strong><small>${escape(card.kicker)} · ${escape(card.source.byline)}</small></span>
        <span class="record-actions">${learned ? icon('check') + '<span class="sr-only">Learned</span>' : ''}
        ${saved ? icon('bookmark') + '<span class="sr-only">Saved</span>' : ''}${icon('arrow')}</span></button>`).join('')}</div>
    ${items.length > limit ? '<div class="button-row"><button class="button" type="button" data-more>Show more</button></div>' : ''}`;
}

function libraryView() {
  return heading('Your field notes', 'Library', 'Find an idea by name, researcher, or whatever you remember.')
    + `<div class="library-tools">
      <label class="searchbox">${icon('search')}<span class="sr-only">Search your library</span>
        <input type="search" id="search" value="${escape(search)}" placeholder="Search your ideas…" autocomplete="off"></label>
      <div class="filters" role="group" aria-label="Filter ideas">
        ${[['all', 'All'], ['learned', 'Learned'], ['saved', 'Saved']].map(([key, label]) =>
          `<button type="button" class="filter" data-filter="${key}" aria-pressed="${filter === key}">${label}</button>`).join('')}
      </div></div><div id="library-results" aria-live="polite">${libraryResults()}</div>`;
}

function settingsView() {
  return heading('Your workspace', 'Settings', 'Keep your reading history portable.')
    + `<div class="settings-grid">
      <section class="panel"><p class="eyebrow">Your data</p><h2>Library backup</h2>
        <p>Your ideas, notes and review progress live in this browser. Export them before switching devices or clearing browser data. Import merges the backup with what you already have.</p>
        <div class="button-row"><button type="button" class="button primary" data-export>${icon('download')} Export backup</button>
          <button type="button" class="button" data-import>${icon('upload')} Import backup</button>
          <input type="file" id="import-file" accept="application/json,.json" hidden></div></section>
      <section class="panel"><p class="eyebrow">Home screen</p><h2>Make it a daily stop</h2>
        <p>On iPhone, open this page in Safari, tap Share, then Add to Home Screen. On Android or desktop, use Install app or Add to Home screen in the browser menu when available.</p></section>
      <section class="panel"><p class="eyebrow">The daily edition</p><h2>Where ideas come from</h2>
        <p>Mind Expansion mixes short original readings based on books and research with brief entries pulled from Simple English Wikipedia. Each card links to its source. The Feed adds illustrated scenes, credited clips where available, and more ideas as you scroll. Today keeps one reading set aside for the day.</p></section>
    </div>`;
}

function releaseSwipe() {
  if (!swipe) return;
  swipeResume = swipe.snapshot();
  swipe.destroy();
  swipe = null;
}

async function changeFeedRecord(card, action) {
  await updateRecord(card, record => action === 'learn' ? learn(record, today) : {
    ...record, saved: !record.saved, updatedAt: new Date().toISOString(),
  });
  const record = state.records[card.id];
  if (storageOK) say(action === 'learn' ? 'Learned. Your first review is tomorrow.'
    : record.saved ? 'Saved to your library.' : 'Bookmark removed.');
}

function rememberPool(cards) {
  pool = [...new Map([...cards, ...pool].map(card => [card.id, card])).values()].slice(0, 120);
  if (library) void library.writePool(pool).catch(() => {});
}

function render() {
  const views = { today: todayView, review: reviewView, library: libraryView, settings: settingsView };
  app.classList.toggle('is-feed', route === 'feed');
  if (route === 'feed') {
    if (!swipe || swipeDay !== today) {
      releaseSwipe();
      swipeDay = today;
      swipe = mountSwipe(app, {
        day: today, icon, escape, onAction: changeFeedRecord, onPool: rememberPool,
        getRecord: id => state.records[id], getDue: () => dueRecords(state, today).length,
        resume: swipeResume,
      });
    }
    swipe.update(state.days[today], pool, pendingDay === today || attemptedDay !== today);
  } else {
    releaseSwipe();
    app.innerHTML = (!storageOK ? '<p class="storage-warning">Browser storage is unavailable. Export a backup to keep any changes made here.</p>' : '') + views[route]();
  }
  app.setAttribute('aria-busy', (route === 'today' || route === 'feed') && pendingDay === today ? 'true' : 'false');
  for (const link of document.querySelectorAll('[data-route]')) {
    if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  const count = dueRecords(state, today).length;
  for (const badge of document.querySelectorAll('[data-due-count]')) {
    badge.hidden = !count;
    badge.textContent = count;
  }
  document.title = (route === 'feed' || route === 'today') ? 'Mind Expansion' : route[0].toUpperCase() + route.slice(1) + ' · Mind Expansion';
}

async function ensureToday(retry = false) {
  const day = today;
  if (state.days[day] || pendingDay === day || (!retry && attemptedDay === day)) return;
  pendingDay = day;
  attemptedDay = day;
  if (route === 'today' || route === 'feed') render();
  try {
    const result = await selectIdea({ state, day, pool, allowNetwork: navigator.onLine });
    const card = result.card ? authoredLesson(result.card) : null;
    if (card && !state.days[day]) {
      state.days[day] = card;
      await saveChanges({ records: {}, days: { [day]: card } });
    }
    if (result.pool.length) rememberPool(result.pool);
  } catch {
    // The retry screen also covers a source that fails before returning a response.
  } finally {
    if (pendingDay === day) pendingDay = '';
    if (today === day && (route === 'today' || route === 'feed')) render();
  }
}

function checkDate() {
  const next = dayKey();
  if (next === today) return;
  today = next;
  practiceId = '';
  revealed = '';
  render();
  void ensureToday();
}

function getCard(id) {
  return state.records[id]?.card || (state.days[today]?.id === id ? state.days[today] : null);
}

function showDetail(id) {
  const record = state.records[id];
  if (!record) return;
  const { card } = record;
  dialog.setAttribute('aria-labelledby', 'detail-title');
  dialog.innerHTML = `<div class="dialog-top">${cardMeta(card)}
      <button type="button" class="icon-button" aria-label="Close idea" data-close autofocus>${icon('close')}</button></div>
    <h2 id="detail-title">${escape(card.title)}</h2>${reading(card)}
    ${record.learned ? `<p class="review-count">${icon('review')} Review ${escape(reviewDate(record.due))} · ${record.reviews} completed</p>` : ''}
    <form data-note-form="${card.id}"><label class="note-field">Your note
      <textarea name="note" maxlength="3000" placeholder="Where could you use this?">${escape(record.note)}</textarea></label>
    <div class="button-row">
      <button type="submit" class="button primary">Save note</button>
      ${record.learned ? '' : `<button type="button" class="button" data-learn="${card.id}">${icon('check')} Mark as learned</button>`}
      ${saveButton(card, record)}
    </div></form>`;
  if (!dialog.open) dialog.showModal();
}

function updateViewForRecord(id, button) {
  if (dialog.open) {
    const updated = state.records[id];
    const form = dialog.querySelector('form');
    const note = form.elements.note;
    const draft = note.value;
    const noteChanged = draft !== note.defaultValue;
    showDetail(id);
    if (noteChanged) dialog.querySelector('textarea').value = draft;
    if (button?.matches('[data-save]')) dialog.querySelector('[data-save]')?.focus();
    else dialog.querySelector('[data-close]')?.focus();
    if (route === 'library') document.querySelector('#library-results').innerHTML = libraryResults();
    if (!updated?.saved && !updated?.learned) dialog.close();
  } else {
    render();
    const target = button?.matches('[data-learn]') ? '[data-practice]' : '[data-save]';
    app.querySelector(target)?.focus();
  }
}

document.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  const data = button.dataset;
  if (data.retry !== undefined) {
    void ensureToday(true);
  } else if (data.learn || data.save) {
    const card = getCard(data.learn || data.save);
    if (!card) return;
    await updateRecord(card, record => data.learn ? learn(record, today) : {
      ...record, saved: !record.saved, updatedAt: new Date().toISOString(),
    });
    updateViewForRecord(card.id, button);
    const record = state.records[card.id];
    say(data.learn ? 'Learned. Your first review is tomorrow.' : record.saved ? 'Saved to your library.' : 'Bookmark removed.');
  } else if (data.practice) {
    practiceId = data.practice;
    revealed = '';
    go('review');
  } else if (data.endPractice !== undefined) {
    practiceId = '';
    revealed = '';
    go('today');
  } else if (data.reveal) {
    revealed = data.reveal;
    render();
    app.querySelector('.review-answer')?.focus();
  } else if (data.rate) {
    const card = getCard(data.id);
    if (!card) return;
    await updateRecord(card, record => record.due <= today ? rate(record, data.rate, today) : record);
    const next = state.records[card.id].due;
    say(next === addDays(today, 1) ? 'This idea returns tomorrow.' : 'Next review ' + reviewDate(next) + '.');
    revealed = '';
    practiceId = '';
    render();
    app.querySelector('[data-reveal]')?.focus();
  } else if (data.filter) {
    filter = data.filter;
    limit = 30;
    for (const item of app.querySelectorAll('[data-filter]')) {
      item.setAttribute('aria-pressed', String(item.dataset.filter === filter));
    }
    document.querySelector('#library-results').innerHTML = libraryResults();
  } else if (data.more !== undefined) {
    const previous = limit;
    limit += 30;
    document.querySelector('#library-results').innerHTML = libraryResults();
    app.querySelectorAll('[data-detail]')[previous]?.focus();
  } else if (data.detail) {
    showDetail(data.detail);
  } else if (data.close !== undefined) {
    dialog.close();
  } else if (data.export !== undefined) {
    exportBackup();
  } else if (data.import !== undefined) {
    document.querySelector('#import-file').click();
  }
});

app.addEventListener('input', event => {
  if (event.target.id !== 'search') return;
  search = event.target.value;
  limit = 30;
  document.querySelector('#library-results').innerHTML = libraryResults();
});

dialog.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  const card = getCard(form.dataset.noteForm);
  if (!card) return;
  const note = String(new FormData(form).get('note')).trim();
  await updateRecord(card, record => ({ ...record, note, updatedAt: new Date().toISOString() }));
  form.elements.note.defaultValue = note;
  form.elements.note.value = note;
  document.querySelector('#library-results').innerHTML = libraryResults();
  say('Note saved.');
});

function exportBackup() {
  const backup = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(backup);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mind-expansion-' + today + '.json';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  say('Backup downloaded.');
}

app.addEventListener('change', async event => {
  if (event.target.id !== 'import-file' || !event.target.files.length) return;
  const file = event.target.files[0];
  event.target.value = '';
  try {
    if (file.size > 20 * 1024 * 1024) throw new Error('This backup is larger than 20 MB.');
    let value;
    try {
      value = JSON.parse(await file.text());
    } catch {
      throw new Error('Choose a valid Mind Expansion JSON backup.');
    }
    const backup = decodeState(value);
    const merged = mergeState(state, backup);
    const changes = newState();
    for (const [id, record] of Object.entries(merged.records)) {
      if (state.records[id] !== record) changes.records[id] = record;
    }
    for (const [day, card] of Object.entries(merged.days)) {
      if (!state.days[day]) changes.days[day] = card;
    }
    state = merged;
    await saveChanges(changes);
    render();
    say('Backup merged into your library.');
  } catch (error) {
    say(error.message || 'The backup could not be imported.');
  }
});

window.addEventListener('hashchange', () => {
  if (location.hash !== '#main') route = currentRoute();
  if (route !== 'review') {
    revealed = '';
    practiceId = '';
  }
  if (dialog.open) dialog.close();
  render();
  if (location.hash !== '#main') window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
});

window.addEventListener('storage', event => {
  if (library) return;
  try {
    onLocalChange(event, acceptUpdates);
  } catch {
    storageOK = false;
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkDate();
});
window.addEventListener('focus', checkDate);
window.setInterval(checkDate, 30_000);
window.addEventListener('online', () => { if (!state.days[today]) void ensureToday(true); });
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

async function start() {
  try {
    library = await openLibrary();
    state = upgradeLessonState(library.initial);
    pool = library.pool.map(authoredLesson);
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('mind-expansion.library');
      channel.onmessage = event => acceptUpdates(event.data);
    }
  } catch {
    try {
      state = upgradeLessonState(readLocalState());
    } catch {
      storageOK = false;
    }
  }
  render();
  void ensureToday();
}

void start();
