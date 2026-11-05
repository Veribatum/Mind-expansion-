// Each lesson teaches an explanation that can be recalled and used elsewhere.
const step = (label, text) => ({ label, text });
const lesson = (title, takeaway, question, answer, steps) => ({
  title, takeaway, question, answer, steps,
});

export const LESSONS = {
  'choice-blindness': lesson(
    'Your mind can explain a choice you never made.',
    'A convincing reason can be constructed after a decision.',
    'Why does a confident explanation fail to prove that someone remembers their original reason?',
    'The person may be building a reason from the outcome in front of them. In the experiment, people explained a face they had actually rejected.',
    [
      step('The finding', 'In a face-preference experiment, researchers secretly handed people the photo they had rejected. People often accepted it and explained why they had chosen it. They were giving reasons for the opposite of their actual choice.'),
      step('What the experiment reveals', 'Normally, a choice and its outcome match. Switching the outcome breaks that link. When a person still explains the new outcome, the explanation can have been assembled afterward from the information now in front of them.'),
      step('Use the idea', 'Before choosing between two options, write your deciding criteria. Afterward, compare your explanation with that record. You now have a way to notice whether a reason appeared only after the choice was made.'),
      step('Keep this distinction', 'A person can sincerely believe an explanation they constructed afterward. Confidence tells you how convincing the explanation feels. A record made before the decision tells you what they were actually considering then.'),
    ]),
  'pluralistic-ignorance': lesson(
    'A group can enforce a rule most members dislike.',
    'Public compliance can hide widespread private disagreement.',
    'How can a norm keep going when many people privately dislike it?',
    'Each person sees everyone else complying and interprets that behavior as approval. Their own compliance then gives the same misleading signal to others.',
    [
      step('The finding', 'Prentice and Miller asked students how comfortable they were with campus drinking. Students tended to rate other students as more comfortable than they were themselves. Their picture of the group differed from the private views being reported.'),
      step('The feedback loop', 'Imagine five people who dislike a meeting format. Each stays quiet because the others seem fine with it. Silence becomes evidence of approval. Everyone contributes to the appearance of a consensus that nobody has actually checked.'),
      step('Break the loop', 'Collect opinions privately before discussing them as a group. An anonymous vote changes what people can observe: the group sees individual preferences directly, instead of guessing them from public behavior.'),
      step('What to remember', 'Pluralistic ignorance is a mismatch between private beliefs and perceived group beliefs. To diagnose it, measure both. Seeing people follow a rule tells you that they follow it; ask what they privately think before concluding why.'),
    ]),
  'loftus-broken-glass': lesson(
    'A question can change what a witness remembers.',
    'Details supplied after an event can enter the later account.',
    'Why should an interviewer ask for a free account before naming details?',
    'Naming details can supply new information that affects the later report. A free account records what the person recalls before the interviewer adds cues.',
    [
      step('The finding', 'Loftus and Palmer showed films of car accidents. Stronger wording such as “smashed” increased speed estimates. In a later test, people given that verb were more likely to report broken glass. The film contained none.'),
      step('How memory can shift', 'Remembering an event involves reconstructing it from stored information. A later question supplies another detail. When that detail fits the story, a person may later report it as part of what they saw.'),
      step('A worked example', 'After a disagreement, “What did she say?” lets someone supply the wording. “Why did she insult you?” already introduces an interpretation. Record the first account before discussing your interpretation of it.'),
      step('The lesson', 'Separate what someone independently recalled from details introduced afterward. The experiment shows why the timing and wording of questions matter when you are trying to reconstruct an event accurately.'),
    ]),
  'spotlight-shirt': lesson(
    'You overestimate how much people notice you.',
    'Your own attention is a poor estimate of everyone else’s attention.',
    'Why can a minor mistake feel much more visible to you than to the people around you?',
    'You experience your own mistake in detail, then use that vivid experience to estimate other people’s attention. They have their own concerns and may have barely registered it.',
    [
      step('The finding', 'Gilovich and colleagues had people enter a room wearing an embarrassing shirt. The wearers overestimated how many observers would remember it. Their personal sense of being conspicuous exceeded what the observers reported.'),
      step('Why it feels so big', 'You know the detail, its meaning to you, and what you hoped people would think. Other people see a much smaller slice of that experience. Judging their attention from your own viewpoint can inflate your estimate.'),
      step('Try a reality check', 'After replaying an awkward moment, list the small mistakes you remember other people making that day. Notice how little of their behavior you retained. Use that comparison to revise your estimate of how much they retained of yours.'),
      step('Use the finding carefully', 'This is a tendency to overestimate attention. It gives you a reason to check your prediction against evidence. Ask what another person actually noticed before treating your feeling of exposure as a measurement.'),
    ]),
  'boundary-memory': lesson(
    'Memory can add scenery outside a photograph.',
    'Your remembered scene can include details you inferred.',
    'How could two people remember different edges around the same photograph?',
    'They can reconstruct the scene with different expected surroundings. In boundary-extension experiments, people often recalled a wider view than was shown.',
    [
      step('The finding', 'Intraub and Richardson showed people close-up photographs. Later, people often remembered the view as wider than it had been. Their remembered picture included a little more of the surrounding scene.'),
      step('The explanation', 'A photograph cuts off a world that seems to continue beyond its edges. As you understand the scene, you can infer those surroundings. In a later reconstruction, that inference can contribute to where you remember the edges being.'),
      step('Test it on yourself', 'Choose a photo, study it briefly, then hide it. Sketch the positions of the subject and the frame edges. Reopen the image and compare the crop. Check which parts of your sketch came from the picture and which came from expectation.'),
      step('The useful distinction', 'A memory can preserve the meaning of a scene while changing its boundaries. When a precise visual detail matters, compare it with the original image rather than relying entirely on the feeling of having seen it.'),
    ]),
  'beluga-half-sleep': lesson(
    'Belugas can sleep with one brain hemisphere at a time.',
    'Sleep can be distributed unevenly across a brain.',
    'What did measuring both brain hemispheres reveal that watching a resting whale alone could not?',
    'EEG showed stronger slow-wave sleep on one side while the other side was more wake-like. Behavior alone could miss that split in brain state.',
    [
      step('The fact', 'A beluga can show strong slow waves of sleep in one brain hemisphere while the other hemisphere remains more wake-like. This is called unihemispheric slow-wave sleep. Both halves do not have to enter the same state together.'),
      step('Why that matters in water', 'A whale is a mammal that must surface to breathe. Research on aquatic mammals connects this uneven sleep pattern with the ability to keep moving and monitor the environment while getting sleep. The sleeping animal can retain useful activity.'),
      step('How researchers know', 'Lyamin’s team measured EEG from both hemispheres of one young male beluga over four days while recording its eyelids. The eye linked to the more wake-like hemisphere was usually open. The electrical recordings established the split; the eyelids were an imperfect clue.'),
      step('The lesson', 'Sleep is more complex than a single switch that shuts off the whole brain. If you judge sleep only by stillness or closed eyes, you can miss an animal whose behavior and brain state are organized differently from yours.'),
    ]),
  'octopus-hunting-team': lesson(
    'Fish scout. The octopus controls the group’s commitment.',
    'Different members can lead different parts of the same task.',
    'How could one animal lead a search while another leads whether the group commits?',
    'Leadership has several dimensions. Fish can influence where a group explores, while an octopus influences whether and when the group moves toward an opportunity.',
    [
      step('The finding', 'In Red Sea hunting groups, fish helped drive exploration of where to go. The octopus influenced whether and when the group moved. A single label such as “leader” hides that division of control.'),
      step('Why the partnership can work', 'The animals bring different ways of finding and reaching prey. Movement tracking and field experiments showed that group composition changed how the hunt unfolded. The result depended on which species participated.'),
      step('Cooperation has conflict', 'Researchers also filmed octopuses punching fish out of position. The study treats this as partner control. Sharing a task can create mutual benefits while leaving individuals with competing interests.'),
      step('A model you can reuse', 'When analyzing teamwork, ask three separate questions: who finds options, who chooses an option, and who can stop the action? The answer can be different for each part of the task.'),
    ]),
  'bee-ball-play': lesson(
    'Bumblebees rolled balls without getting food for it.',
    'Experiments can test a behavior’s function without knowing an animal’s feelings.',
    'Why did the researchers provide a clear route to food and no reward for rolling the balls?',
    'Those controls helped rule out food access and obstacle removal as reasons for rolling, strengthening the interpretation that the behavior met criteria for play.',
    [
      step('The finding', 'A study followed 45 bumblebees given a clear route to food and an optional area with wooden balls. Some took the detour and repeatedly rolled the balls. Individual totals ranged from one to 117 rolls across the experiment.'),
      step('The controls matter', 'Rolling was unnecessary to reach food and earned no food reward. The setup also reduced explanations such as clearing a blocked path. A behavior that looks playful becomes more informative when you test what else could cause it.'),
      step('A second line of evidence', 'Other bees later preferred a color associated with the ball area, even when the balls were gone. That suggested the experience had been rewarding. The researchers evaluated it against behavioral criteria for animal play.'),
      step('What you actually learned', 'You can investigate the function of a behavior by changing its consequences and measuring what the animal chooses. The observations support a play interpretation while leaving the bee’s subjective experience open.'),
    ]),
  'glassfrog-blood': lesson(
    'A sleeping glassfrog stores most red blood cells in its liver.',
    'Camouflage can involve changes inside the body.',
    'Why does moving red blood cells out of circulation help a glassfrog become transparent?',
    'Red blood cells strongly absorb and scatter light. Storing many of them in the liver reduces how much visible blood is spread through the rest of the body.',
    [
      step('The fact', 'Resting glassfrogs can remove about 89% of their red blood cells from circulation and pack them into the liver. In the study, this increased transparency two- to threefold. The cells returned to circulation during activity.'),
      step('The optical problem', 'Transparent skin alone cannot hide a body full of visible blood. Red blood cells strongly reduce light transmission. Concentrating them in one organ reduces the material that reveals the rest of the animal.'),
      step('How the team checked', 'Researchers used photoacoustic imaging to follow red blood cells in living frogs. This let them locate the cells inside the body, instead of guessing the mechanism from photographs of a transparent frog.'),
      step('The deeper lesson', 'The camouflage depends on controlling an internal obstacle to transparency. It also creates a new research problem: explaining how the animal stores densely packed blood cells without harmful clotting.'),
    ]),
  'baboon-peace-culture': lesson(
    'A troop’s gentler social pattern outlasted its original males.',
    'A social environment can help maintain behavior across new members.',
    'Why did the arrival of new males make this observation more interesting?',
    'The gentler behavior persisted despite turnover. That makes the continuing social environment a possible contributor, alongside the personalities of the original survivors.',
    [
      step('The event', 'In a wild baboon troop, tuberculosis killed several males, disproportionately including aggressive ones. Researchers then observed less aggression toward lower-ranking males and more affiliative behavior in the surviving group.'),
      step('The important follow-up', 'New males later joined, yet the less aggressive pattern persisted. That observation moves the question beyond which individuals originally survived: what about the group could help maintain the pattern through turnover?'),
      step('What culture means here', 'A stable local social pattern can shape the interactions a newcomer encounters. The researchers interpreted the continuing pattern as evidence consistent with social transmission. This was a field observation of one troop, with comparisons.'),
      step('Apply the question', 'When a workplace keeps the same habits after people leave, examine what newcomers encounter: which behavior gets rewarded, challenged, or copied? Turnover alone may leave the social conditions that sustain a habit in place.'),
    ]),
  'cold-war-art': lesson(
    'The CIA funded cultural institutions to influence intellectual life.',
    'Influence can operate through funding, distribution, and prestige.',
    'How can a sponsor influence a cultural debate without dictating every sentence an artist writes?',
    'The sponsor can fund organizations, magazines, events, and distribution that make selected voices more visible and credible.',
    [
      step('The documented operation', 'The CIA covertly backed the Congress for Cultural Freedom. The organization published journals such as Encounter and held conferences that brought influential thinkers together. Its aim included countering the appeal of Soviet communism.'),
      step('How influence works', 'Funding an institution changes what can be published, circulated, or discussed at prestigious events. This is a way to shape a debate’s reach and audience through the organizations that carry it.'),
      step('Where abstract painting fits', 'In that era, MoMA’s International Program toured American abstract painting in Europe. Its archive documents the exhibitions. The CIA’s history documents its cultural network. Identifying an exhibition’s organizer and funding links is how you test a more specific claim.'),
      step('A useful way to investigate', 'For any influence claim, trace four things: who financed the institution, what it produced, how it reached an audience, and what evidence connects those steps. “Government psyop” is the starting claim; those links give you an explanation you can evaluate.'),
    ]),
  'wow-signal': lesson(
    'The Wow! printout recorded signal strength, not a decoded message.',
    'A striking observation becomes more informative when it can be checked independently.',
    'Why would a repeat detection add so much to the original Wow! recording?',
    'It could let researchers check location, frequency, and behavior over time and compare explanations against new observations.',
    [
      step('The recorded fact', 'In 1977, Big Ear recorded a strong narrowband radio signal lasting about 72 seconds. Jerry Ehman circled its printout and wrote “Wow!” The sequence represented changes in measured strength. It was not a decoded sentence.'),
      step('Why it attracted attention', 'A signal concentrated into a narrow frequency range can be interesting in a search for transmitters. The strength pattern and frequency gave astronomers an event to investigate, but did not uniquely identify its source.'),
      step('What the follow-up adds', 'Later searches found no confirmed repeat. Repetition would allow comparisons of direction, frequency, and timing. With one detection, several possible explanations have less evidence against which to compete.'),
      step('The lesson', 'Separate the existence of an unusual measurement from your explanation of it. Then ask which new observation would distinguish the competing explanations. That question turns a mystery into a research problem.'),
    ]),
  'dyatlov-snow-slab': lesson(
    'A delayed snow-slab release could fit the Dyatlov conditions.',
    'A model tests whether an explanation is physically possible under stated conditions.',
    'How could a snow slab fail hours after a tent platform was cut?',
    'Cutting the slope can weaken support. Later wind-driven snow loading can add stress until the slab releases.',
    [
      step('The puzzle', 'Nine hikers died at Dyatlov Pass in 1959. A snow avalanche initially seemed hard to reconcile with the apparently gentle slope and limited signs. Gaume and Puzrin tested a more specific small-slab scenario.'),
      step('The mechanism', 'Cutting a platform into a slope can remove support from a snow slab. Wind can continue adding snow above it. Failure can therefore occur later, after extra loading pushes the weakened slab past its threshold.'),
      step('What was tested', 'The team modeled release conditions and potential impact. Later expeditions also observed avalanches in the area. These checks address objections about physical plausibility and local conditions.'),
      step('The lesson', 'A model earns value by stating assumptions and producing consequences you can test. Showing that a mechanism can work narrows the investigation. Establishing that it actually happened requires evidence of the particular event.'),
    ]),
  'strasbourg-dancing': lesson(
    'Historical records can establish an event more firmly than its cause.',
    'Evidence can support different parts of a story with different strength.',
    'Why can historians document the dancing outbreak while remaining uncertain about its cause?',
    'Contemporary records describe behavior and official responses. They lack the measurements needed to identify a cause with the same confidence.',
    [
      step('What is recorded', 'Strasbourg records describe an outbreak of compulsive dancing in 1518 and the authorities’ response. Historian John Waller used chronicles and city materials to reconstruct the episode. These are evidence for what people reported and did.'),
      step('One causal account', 'Waller argues that severe stress and shared local beliefs shaped the outbreak. This account tries to explain why distress might take a culturally recognizable form and spread among people exposed to similar expectations.'),
      step('Why the cause stays uncertain', 'The sources were written for purposes other than modern measurement. They can preserve an event while leaving gaps about individual experiences, exact numbers, and possible alternative explanations.'),
      step('Use this distinction', 'When reading an unusual historical story, ask which evidence supports the event, the proposed mechanism, and the details added later. Confidence in one part of the story need not carry over to all three.'),
    ]),
};

export function applyLesson(card) {
  const plan = LESSONS[card.id];
  if (!plan) return card;
  return {
    ...card, title: plan.title, lesson: plan,
    intro: plan.steps.map(step => step.text).join('\n\n'),
    prompt: plan.question, answer: plan.answer,
  };
}

export function isLesson(card) {
  return !!card?.lesson && card.lesson.steps.length >= 3;
}

function completeSentences(text) {
  return text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map(line => line.trim()).filter(Boolean) || [];
}

export function authoredLesson(card) {
  const enhanced = applyLesson(card);
  if (enhanced.lesson || card.id.startsWith('simple-wiki-')) return enhanced;
  const parts = completeSentences(card.intro);
  const split = Math.max(1, Math.ceil(parts.length / 2));
  const steps = [
    step('The idea', parts.slice(0, split).join(' ')),
    step('The explanation', parts.slice(split).join(' ')),
    ...(card.example ? [step('A worked example', card.example)] : []),
    step('Remember this', card.answer),
  ].filter(item => item.text);
  return { ...card, lesson: {
    title: card.title, takeaway: card.answer, question: card.prompt,
    answer: card.answer, steps,
  } };
}

export function lessonReading(card, escape) {
  if (!card.lesson) return '<p class="idea-text">' + escape(card.intro) + '</p>';
  return '<div class="lesson-reading">' + card.lesson.steps.map(item =>
    '<section><h3>' + escape(item.label) + '</h3><p>' + escape(item.text) + '</p></section>').join('')
    + '<p class="lesson-takeaway"><strong>Remember</strong> ' + escape(card.lesson.takeaway) + '</p></div>';
}

export function upgradeLessonState(state) {
  return {
    ...state,
    records: Object.fromEntries(Object.entries(state.records).map(([id, record]) =>
      [id, { ...record, card: authoredLesson(record.card) }])),
    days: Object.fromEntries(Object.entries(state.days).map(([day, card]) =>
      [day, authoredLesson(card)])),
  };
}
