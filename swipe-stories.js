import { featuredClip } from './swipe-media.js?v=8';
import { BOOK_STORIES } from './book-stories.js?v=8';
import { isFreshCard, rankCards } from './preferences.js?v=8';
import { EDITORIAL } from './cards.js?v=8';
import { authoredLesson, isLesson } from './lessons.js?v=8';
import { DEEP_CARDS, DEEP_STORIES } from './deep-cuts.js?v=8';
import { dayNumber, normalize } from './learning.js?v=8';

const BOOK_LOOKS = {
  'voss-mirror': ['dialogue', 'violet'], 'voss-label': ['dialogue', 'rose'], 'voss-how-question': ['dialogue', 'blue'],
  'carnegie-interest': ['dialogue', 'mint'], 'carnegie-appreciation': ['dialogue', 'amber'], 'covey-understand': ['dialogue', 'blue'],
  'hill-definite-purpose': ['plan', 'amber'], 'hill-persistence': ['plan', 'rose'], 'covey-influence': ['network', 'mint'],
  'covey-big-rocks': ['clock', 'violet'], 'clear-two-minutes': ['habit', 'mint'], 'newport-deep-break': ['memory', 'blue'],
  'sun-tzu-solve-without-a-fight': ['plan', 'amber'], 'sun-tzu-know-both-sides': ['network', 'violet'],
  'sun-tzu-like-water': ['ocean', 'blue'], 'carnegie-speak-to-their-interests': ['dialogue', 'rose'],
  'clear-second-mistake': ['habit', 'blue'],
  'robbins-state': ['network', 'rose'], 'ghost-army': ['tank', 'amber'], 'mincemeat': ['plan', 'blue'],
  'skinner-pigeons': ['pigeon', 'violet'], 'dazzle-ships': ['ship', 'mint'],
};

const make = (art, title, beats, accent) => ({ art, title, beats, accent });
const ORIGINALS = {
  'retrieval-practice': make('memory', 'The test is the lesson.', [
    ['The easy trap', 'Read a page twice and it starts to feel familiar. That feeling is easy to mistake for knowing it.'],
    ['Close the book', 'Look away. Can you explain the idea without seeing the words? The effort of bringing it back is practice.'],
    ['Make it stick', 'Check what you missed, then try again tomorrow. In experiments by Roediger and Karpicke, recall beat rereading on delayed tests.'],
  ], 'mint'),
  survivorship: make('plane', 'Where would you armor the plane?', [
    ['The clue', 'Planes return from missions with damage scattered across their wings. Where would you add armor?'],
    ['Look at the blank spots', 'The records only show planes that returned. Hits in other places may have kept some planes from coming back.'],
    ['The reveal', 'Abraham Wald used that missing group to think about vulnerability. Any time you study the winners, ask who never made it into your data.'],
  ], 'rose'),
  'implementation-intentions': make('habit', 'Give the habit an address.', [
    ['The vague plan', '“I’ll read more” sounds like a plan until your day gets busy and there’s no obvious time to start.'],
    ['Attach it to a cue', 'Put a specific action after a moment you already know will happen. After I pour my coffee, I’ll open one idea.'],
    ['The takeaway', 'Pick one action and one cue. When the cue happens, you already know your next move.'],
  ], 'violet'),
  'next-visible-action': make('habit', 'Name the very next move.', [
    ['The fog', '“Plan the trip” leaves you with a pile of decisions every time you look at your list.'],
    ['The next move', 'David Allen calls for a next action you could do right now. Try “Text my travel partner to ask which dates work.”'],
    ['Try it', 'Take one thing you’ve been putting off. Write the first action as if you were handing it to someone else.'],
  ], 'mint'),
  'goodhart-target': make('metric', 'A scoreboard can change the game.', [
    ['The scoreboard', 'A help desk starts rewarding the team for tickets closed. The number climbs. Success?'],
    ['The reveal', 'People can close tricky tickets before solving them. The scoreboard improves while the customer’s problem stays right where it was.'],
    ['Spot it', 'Ask how someone could hit the target while making the real outcome worse. That’s a clue your metric needs company.'],
  ], 'amber'),
  'leverage-points': make('network', 'Move the rule, move the system.', [
    ['More effort?', 'Every grocery trip pushes the household budget a little further over. Reminding everybody to try harder only goes so far.'],
    ['Change the information', 'What if each person saw the remaining balance before shopping? Donella Meadows calls information flow a place to intervene in a system.'],
    ['Look for leverage', 'Look at the rules, who has information, and what the system rewards. A small change there can shift a lot of decisions.'],
  ], 'amber'),
  'choice-architecture': make('habit', 'Why does the easy choice win?', [
    ['Same choices', 'There’s a phone across the room and a book beside your coffee. Tomorrow, swap their places. Which will you reach for?'],
    ['The reveal', 'Placement and friction change what feels like the natural choice. Richard Thaler and Cass Sunstein call this choice architecture.'],
    ['Use it', 'Put the choice you want in easy reach. You’ll still have the other options when you actually want them.'],
  ], 'violet'),
  'finite-time': make('clock', 'Every yes spends time.', [
    ['The calendar', 'Say yes to another project. Where are those hours coming from?'],
    ['The trade', 'Oliver Burkeman argues that a useful plan starts by facing how much you’ll leave undone. Every hour has another possible use.'],
    ['Try it', 'Before you say yes, name what you’re willing to postpone. Now you’re making a choice you can see.'],
  ], 'rose'),
  'desirable-difficulties': make('memory', 'Some struggle pays you back later.', [
    ['The smooth run', 'You solve ten nearly identical practice problems in a row. The last few feel automatic.'],
    ['Mix the practice', 'Try different kinds of problems together. Now part of the work is figuring out which approach to use. It feels slower.'],
    ['The reveal', 'Robert and Elizabeth Bjork distinguish smooth performance today from what you can do later. The useful difficulty is one you can learn from.'],
  ], 'violet'),
  'regression-to-mean': make('metric', 'Was it really the new shoes?', [
    ['The outlier', 'You have your slowest run of the month. You swap shoes, and your next run is faster.'],
    ['Another explanation', 'Unusually bad days often get followed by more ordinary ones. Even the old shoes might have looked better the next day.'],
    ['The takeaway', 'Compare several runs. An improvement after an extreme result can happen even if your intervention did very little.'],
  ], 'blue'),
  'feynman-guess': make('network', 'What would change your mind?', [
    ['The guess', 'You suspect a bad switch port is causing packet drops. How could you check?'],
    ['Make a prediction', 'If the port is the problem, moving the connection to a working port should reduce the drops under the same test.'],
    ['The test', 'Write down what would count against the guess before you look. Feynman describes that comparison with observation as the heart of the method.'],
  ], 'mint'),
  'tragedy-commons': make('network', 'Who gets to make the rules?', [
    ['The shared resource', 'Several teams need the same lab. A calendar imposed from outside looks tidy until it ignores how the teams actually work.'],
    ['The surprise', 'Elinor Ostrom found communities that managed shared resources over long periods. Users often had a say in shaping the rules.'],
    ['The takeaway', 'If you share a resource, invite the people who use it to set rules and make it easy to see whether they’re followed.'],
  ], 'amber'),
  'spacing-effect': make('clock', 'Come back after it fades a bit.', [
    ['One long session', 'You can reread the same thing four times tonight. It feels fresh each time because it’s already on your mind.'],
    ['Spread it out', 'Try once today, once tomorrow, and again later. Each return makes you rebuild more of the idea from memory.'],
    ['The takeaway', 'Research reviewed by Nicholas Cepeda and colleagues found that spacing helps later recall. The useful gap depends partly on how long you want to remember.'],
  ], 'blue'),
  'advice-from-future': make('clock', 'It failed. Now work backward.', [
    ['Jump ahead', 'Imagine it’s next Friday and your rollout has already failed. What went wrong?'],
    ['Get specific', 'Ask each person to write one plausible reason before anyone speaks. You’ll hear worries that can get buried in ordinary planning.'],
    ['Bring it back', 'Gary Klein calls this a premortem. Use the imagined failure to change the real plan while there’s time.'],
  ], 'rose'),
};

const plan = (id, title, kicker, intro, example, prompt, answer, source, tags) => ({
  id, topic: 'science', kind: 'essay', title, kicker, intro, example, prompt, answer, source, tags,
});

export const FEATURED = [
  plan('lunar-phases', 'The Moon isn’t changing shape.', 'Lunar phases',
    'Sunlight usually lights half of the Moon. As the Moon orbits Earth, we see different amounts of that bright half. At a new Moon most of the lit half faces away from us. At a full Moon we see nearly all of it. Earth’s shadow causes a lunar eclipse, which is a different event.',
    'Picture a lamp shining on a ball. Walk around the ball and the bright part you can see changes, even though the lamp keeps shining.',
    'Why does the Moon appear to change shape over the month?',
    'As it orbits Earth, we see different amounts of its sunlit half.',
    { title: 'Moon Phases Loop', byline: 'NASA Scientific Visualization Studio', url: 'https://svs.gsfc.nasa.gov/4310/' },
    ['Moon', 'space', 'astronomy', 'sunlight', 'phases']),
  plan('ocean-eddies', 'The ocean moves in curls.', 'Ocean eddies',
    'A big ocean current has smaller rotating features along its edges. These ocean eddies can carry heat, salt, and other material as they travel. NASA’s visualization uses an ocean model constrained by observations to make the moving patterns visible.',
    'In the clip, follow one narrow stream until it curls into a ring. Watch the difference between the broad current and the smaller rotating water.',
    'What is an ocean eddy, and what can it carry?',
    'An eddy is a rotating body of water. It can carry heat, salt, and other material.',
    { title: 'Perpetual Ocean', byline: 'NASA Scientific Visualization Studio', url: 'https://svs.gsfc.nasa.gov/3827/' },
    ['ocean currents', 'earth science', 'eddies', 'oceanography']),
];

ORIGINALS['lunar-phases'] = make('moon', 'The Moon isn’t changing shape.', [
  ['Watch the edge', 'The Moon looks like a different shape from one night to the next. What’s moving?'],
  ['A new angle', 'The Sun lights half of it. As the Moon goes around Earth, we see different amounts of that bright half.'],
  ['See the cycle', 'A lunar eclipse involves Earth’s shadow. Ordinary phases are about our viewing angle. Watch the NASA loop and follow the bright side.'],
], 'blue');
ORIGINALS['ocean-eddies'] = make('ocean', 'The ocean moves in curls.', [
  ['A restless surface', 'Zoom out on an ocean current and the flow looks like a long ribbon. Look closer and it starts to curl.'],
  ['Follow the spin', 'Those rotating patches of water are eddies. They can move heat and other material around as they travel.'],
  ['See it in motion', 'The NASA visualization reveals patterns a still map hides. Follow one curl as it forms along the edge of a current.'],
], 'mint');

const STYLE_BY_TOPIC = {
  mind: ['lens', 'violet'], thinking: ['lens', 'rose'], systems: ['network', 'amber'],
  science: ['orbit', 'blue'], practice: ['memory', 'mint'],
  animals: ['lens', 'mint'], culture: ['crowd', 'amber'], mysteries: ['signal', 'blue'],
};

function sourceBeats(card) {
  const lines = typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter('en', { granularity: 'sentence' }).segment(card.intro), x => x.segment.trim())
    : card.intro.match(/[^.!?]+[.!?]?/g)?.map(x => x.trim()) || [];
  const captions = ['The idea', 'A closer look', 'One more detail', 'From the source'];
  const clean = lines.filter(Boolean).slice(0, 4);
  return (clean.length ? clean : [card.intro]).map((text, i) => [captions[i], text]);
}

export function storyFor(card) {
  const taught = authoredLesson(card);
  const look = BOOK_LOOKS[card.id];
  const appearance = look ? { art: look[0], accent: look[1] } : DEEP_STORIES[card.id] || ORIGINALS[card.id];
  const [art, accent] = STYLE_BY_TOPIC[card.topic];
  if (taught.lesson) {
    return make(appearance?.art || art, taught.title,
      taught.lesson.steps.map(step => [step.label, step.text]), appearance?.accent || accent);
  }
  return make(art, card.title, sourceBeats(card), accent);
}

export function beatSeconds(text) {
  return Math.min(28, Math.max(6, Math.ceil(text.trim().split(/\s+/).length / 2.65 + 1.5)));
}

export function cardKey(card) {
  return normalize(card.id.startsWith('simple-wiki-') ? card.title : card.kicker || card.title);
}

export function inCollection(card, mode) {
  if (mode === 'videos') return !!featuredClip(card);
  return card.topic === 'mysteries' || (card.topic === 'culture' && (
    card.kind !== 'research' || card.tags.some(tag => /\bhistor(y|ical)\b/i.test(tag))
  ));
}

export function openingCards(daily, pool, day, records = {}, catalog = [], { mode = 'feed', viewed = new Set() } = {}) {
  const byId = new Map([...EDITORIAL, ...FEATURED, ...DEEP_CARDS, ...BOOK_STORIES].map(card => [card.id, card]));
  const editions = [
    ['voss-mirror', 'ghost-army', 'hill-definite-purpose', 'beluga-half-sleep', 'covey-big-rocks'],
    ['hill-persistence', 'mincemeat', 'carnegie-interest', 'octopus-hunting-team', 'clear-two-minutes'],
    ['covey-understand', 'skinner-pigeons', 'robbins-state', 'bee-ball-play', 'newport-deep-break'],
    ['voss-label', 'dazzle-ships', 'covey-influence', 'glassfrog-blood', 'carnegie-appreciation'],
  ];
  const offset = ((dayNumber(day) - dayNumber('2026-11-05')) % editions.length + editions.length) % editions.length;
  const ordered = [...editions.slice(offset), ...editions.slice(0, offset)].flat();
  const featuredBooks = ['sun-tzu-like-water', 'carnegie-speak-to-their-interests', 'sun-tzu-know-both-sides', 'sun-tzu-solve-without-a-fight'];
  const history = ['ghost-army', 'skinner-pigeons', 'mincemeat', 'dazzle-ships'].map(id => byId.get(id));
  const clips = ['beluga-half-sleep', 'octopus-hunting-team', 'voss-mirror'];
  const candidates = [
    ...(mode === 'history' ? history : mode === 'videos' ? clips.map(id => byId.get(id)) : []),
    byId.get(featuredBooks[offset]), ...catalog.slice(0, 3), ...ordered.slice(0, 5).map(id => byId.get(id)), daily,
    ...ordered.slice(5).map(id => byId.get(id)), ...BOOK_STORIES, ...DEEP_CARDS,
    ...EDITORIAL, ...FEATURED, ...catalog.slice(3), ...pool.filter(isLesson),
  ].filter(Boolean).map(authoredLesson).filter(isLesson);
  const ids = new Set();
  const keys = new Set();
  const unique = candidates.filter(card => {
    const key = cardKey(card);
    if (ids.has(card.id) || keys.has(key)) return false;
    ids.add(card.id);
    keys.add(key);
    return true;
  });
  if (mode !== 'feed') return unique.filter(card => inCollection(card, mode));
  const ranked = rankCards(unique.filter(card => card.id !== 'cold-war-art' && isFreshCard(card, records, viewed)), records);
  const first = ((dayNumber(day) % clips.length) + clips.length) % clips.length;
  const rotation = [...clips.slice(first), ...clips.slice(0, first)];
  const video = rotation.map(id => ranked.find(card => card.id === id && featuredClip(card)?.local)).find(Boolean);
  if (video) ranked.unshift(...ranked.splice(ranked.indexOf(video), 1));
  // Keep a history discovery in the first few swipes even with strong ratings in other topics.
  const historyIndex = ranked.findIndex(card => inCollection(card, 'history'));
  if (historyIndex > 3) ranked.splice(3, 0, ...ranked.splice(historyIndex, 1));
  return ranked;
}
