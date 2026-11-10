# Mind Expansion

A daily reading and recall app with a swipeable discovery feed. Each idea has a short read, an illustrated story, or a credited source clip. The recall queue helps you revisit what you’ve learned. Search the library by idea, topic, source, researcher, or a phrase from your notes.

## Run it

Serve the repository root over HTTP, for example with `python3 -m http.server 8000`. For GitHub Pages, select **Settings → Pages → Deploy from a branch → main → /(root)**. The app has no build step, backend, API key, or paid model. The service worker requires HTTPS outside localhost.

## How it works

- **Feed** opens with an explained lesson and continues through research, practical ideas, and eligible source readings from Simple English Wikipedia. Behind the story notes distinguish observations, interpretations, and what remains open. Scroll, swipe, use the up/down keys, or tap the arrows. Sections advance on tap by default. You can turn on automatic progression. Reduced-motion preferences start scene progression paused.
- Illustrations are drawn in the browser from reusable SVG scenes. The app embeds credited NASA Scientific Visualization Studio clips on related cards and checks for freely reusable Wikimedia Commons videos attached to sourced articles. Only the active card loads and plays its clip. Clips start muted when autoplay is allowed and have manual playback controls. Audio narration, where available, comes from the device's speech engine.
- After five ideas, an optional recall prompt offers a place to pause or continue. Saving an idea and marking it as learned remain separate actions.

- The app picks an idea for your device’s local calendar date on opening and checks for a new day when you come back. It rotates topics and retrieves public encyclopedia entries from Simple English Wikipedia. It also includes original editorial cards, some based on books and research. Live entries are clearly labeled and link to their original articles.
- The app pins the selected idea for that date, skips topics you’ve already seen, and caches its public-source topic pools. If a source is temporarily unavailable, it can use an unused built-in card or cached article. If neither is available, it offers a retry.
- Recall is self-rated. Got it moves a card through 1, 3, 7, 14, 30, 60 and 120 days. Again brings it back tomorrow.
- Your library, notes and review history live in this browser. Use **Settings → Export backup** to keep a copy and **Import backup** to merge it into another browser. Import accepts a versioned JSON format. There is no cross-device sync.
- On iPhone, open the site in Safari and select Share → Add to Home Screen. The app shell and previously stored cards work offline. Fresh sources need a connection.

## Integrating it later

`learning.js` is browser- and DOM-independent. It defines the card and review model, local-day helpers, recall scheduling, and a versioned backup format. `feed.js` produces that same card shape. The UI and storage adapter live in `app.js`, so an eventual lifestyle app can reuse the content and review rules with its own storage and home screen.

See individual card source links for attribution. Excerpts from Simple English Wikipedia are available under CC BY-SA 4.0.

### Bundled video credits

- [Beluga at Oceanogràfic Valencia](https://commons.wikimedia.org/wiki/File:Beluga_Oceanografic.webm) by Toniher, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The bundled excerpt has been trimmed and re-encoded without audio under the same license. It is illustrative footage.
- [Octopus–fish hunting group, Supplementary Video 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC11541198/) by Eduardo Sampaio and colleagues, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The bundled research-footage excerpt has been trimmed and re-encoded without audio.

## Lesson content

The feed opens each idea with a finding, follows the explanation through an example, and ends with a question about understanding. Reading sections advance on tap by default. Automatic source readings require an explanation and an example or research paragraph. Short encyclopedia leads are skipped. Rewritten archived lessons retain their saved notes and review history.


## Personalized book and story feed

The feed includes 17 additional original micro-lessons: Think and Grow Rich, Never Split the Difference, The 7 Habits, How to Win Friends and Influence People, Atomic Habits, Deep Work, Tony Robbins coaching exercises, and four unusual military-history stories. Each has a source, a mechanism or example, and a recall question. The previously featured Cold War art story is no longer recommended by default; existing archives retain it.

Like / Dislike are independent of Save / Learn. A rating is stored as `feedback` (-1, 0, 1) on the existing browser-local library record. Legacy records without that field are neutral. Existing note, saved, and review fields are preserved; backups and cross-tab updates include ratings automatically. Settings supports individual undo and resetting ratings.

Recommendations score shared tags, author, topic and content kind; dislikes exclude the exact idea and reduce related content. Learned ideas are demoted. Every fourth selection preserves an exploration slot, and at most two consecutive recommendations share a topic when alternatives exist. Rating an active card only rebuilds its upcoming tail. Discovery category ordering also uses these preferences with periodic unpersonalized exploration. Source availability and existing source quality filters still determine whether new network lessons can be added.

Validation: `node --test` covers valid lessons, relevance changes, dislikes/undo, legacy backups and merges, mixed opening editions, discovery preferences, and the existing archive/review/media behavior. Browser QA covers desktop and 390px phone UI, immediate reordering, persistence after reload, mutual exclusion of ratings, and Settings undo/reset.

## Live catalog and progress

The installed app uses the same origin, manifest ID, start URL, and IndexedDB library. The Progress view uses the local calendar and counts a learning day when a lesson is marked learned or a review is finished. Existing learned dates count. Review dates are recorded from this release onward.

`node --test` validates the existing feed and archive along with the catalog, progress, and media byte ranges. `node scripts/build-site.mjs` produces the self-contained hosted worker. The root files can also be served statically. A static copy uses the bundled readings and on-demand discovery.

The private hosted site uses the `DB` binding and the `drizzle` migration for its shared lesson catalog. `GET /api/lessons` reads the newest entries and supports paging. The connected Mind Expansion app offers `list_lessons` and `publish_lessons`. Both use the same catalog and validation. The task can also use Sites service access for `GET /api/lessons?index=1` and an append-only `POST /api/lessons` with a `{"lessons":[...]}` JSON body. The Site must stay owner-private while using this shared write endpoint. Publishing rejects invalid source links and ignores duplicate IDs, titles, and concepts. The launch lessons in `data/launch-lessons.json` are written through that same path. The catalog does not contain personal ratings, notes, or reviews.

A linked content task reads the existing index, verifies primary sources, and writes original one-minute lessons in batches of up to eight. Include a worked example or mechanism, an exact author and source link, and a recall question. Read back the additions before reporting success. Get fresh service access from the linked Site at runtime. Send its bearer only to the exact live Site in the `OAI-Sites-Authorization` header. Keep credentials out of prompts, output, and source, and skip topics that cannot be verified.
