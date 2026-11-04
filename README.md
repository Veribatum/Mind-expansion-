# Mind Expansion

A daily reading and recall app with a swipeable discovery feed. Each idea has a short read, an illustrated story, or a credited source clip. The recall queue helps you revisit what you’ve learned. Search the library by idea, topic, source, researcher, or a phrase from your notes.

## Run it

Serve the repository root over HTTP, for example with `python3 -m http.server 8000`. For GitHub Pages, select **Settings → Pages → Deploy from a branch → main → /(root)**. The app has no build step, backend, API key, or paid model. The service worker requires HTTPS outside localhost.

## How it works

- **Feed** opens with a video card and continues through original research stories, a daily reading, and deduplicated entries from Simple English Wikipedia. Behind the story notes distinguish observations, interpretations, and what remains open. Scroll, swipe, use the up/down keys, or tap the arrows. You control when to advance, and can pause scene progression or reveal a scene early. Reduced-motion preferences start scene progression paused.
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
