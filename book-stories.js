// Original micro-lessons. Examples are illustrative; links identify each underlying idea.
const source = (title, byline, url) => ({ title, byline, url });
function lesson(id, topic, title, book, author, url, tags, steps, question, answer, context = '') {
  return { id, topic, kind: topic === 'culture' ? 'essay' : 'book', title, kicker: book,
    intro: steps.map(([, text]) => text).join('\n\n'), example: '', prompt: question, answer,
    source: source(book, author, url), tags,
    ...(context ? { context } : {}),
    lesson: { title, takeaway: answer, question, answer, steps: steps.map(([label, text]) => ({ label, text })) } };
}
export const BOOK_STORIES = [
  lesson('voss-mirror', 'mind', 'Repeat three words. Then shut up.', 'Never Split the Difference · Mirroring', 'Chris Voss · The Black Swan Group',
    'https://info.blackswanltd.com/hubfs/The%20Black%20Swan%20Group%20Leadership%20Guide.pdf', ['negotiation', 'conversation', 'listening', 'Chris Voss'], [
      ['A tiny opening', 'Someone says, “We tried that, but the timing was terrible.” Instead of jumping in with advice, try: “The timing was terrible?”'],
      ['What Voss teaches', 'Mirroring repeats a few meaningful words with a curious tone, then leaves silence for the person to elaborate. You are inviting detail without choosing the explanation for them.'],
      ['Try it once', 'They might explain that approval arrived after the deadline. Now you have a concrete obstacle. Use a mirror when you actually want to understand; repeating every sentence soon sounds mechanical.'],
    ], 'After you mirror a few words, what should you do?', 'Pause and listen. The useful part is the detail they add, not the repeated words.'),
  lesson('voss-label', 'mind', 'Name the concern without claiming to read minds.', 'Never Split the Difference · Labeling', 'Chris Voss · The Black Swan Group',
    'https://www.blackswanltd.com/newsletter/labels-vs.-questions-the-key-to-unlocking-the-floodgates-of-truth-talk', ['negotiation', 'conversation', 'listening', 'Chris Voss'], [
      ['Under the objection', '“That price is ridiculous” might mean the budget is tight, the value is unclear, or someone fears looking foolish. Picking one as a fact can derail the conversation.'],
      ['A tentative label', 'Voss teaches labels such as “It sounds like…” to offer an observation the other person can correct. Try: “It sounds like the risk is hard to justify.” Then stop talking.'],
      ['Let them correct you', '“No, the risk is fine; I cannot get approval this quarter.” That correction is useful. Update your understanding instead of defending your guess.'],
    ], 'Why make a label tentative?', 'It leaves room for correction, helping you discover the real concern.'),
  lesson('voss-how-question', 'mind', 'Turn a standoff into a how question.', 'Never Split the Difference · Calibrated questions', 'Chris Voss · The Black Swan Group',
    'https://www.blackswanltd.com/newsletter/how-to-gain-control-in-a-negotiation-in-4-steps', ['negotiation', 'conversation', 'problem solving', 'Chris Voss'], [
      ['The dead end', '“You need to make this work” leaves the other person defending why they cannot. You still do not know the constraint.'],
      ['Ask for the map', 'Voss uses carefully chosen how and what questions to uncover obstacles. An everyday version: “What would need to change for Friday to be realistic?”'],
      ['Use the answer', 'If testing needs two days, ask how you could reduce the scope while keeping those checks. Pause after your question. Asking another one immediately can bury the useful answer.'],
    ], 'What should a useful how or what question uncover?', 'The constraints and conditions needed to make a plan workable.'),
  lesson('hill-definite-purpose', 'practice', 'A wish needs a job description.', 'Think and Grow Rich · Definite purpose', 'Napoleon Hill',
    'https://www.naphill.org/think-and-grow-rich-programs/', ['goals', 'planning', 'Napoleon Hill', 'self improvement'], [
      ['The wish', '“I want to be successful” gives you little help choosing what to do this afternoon. Napoleon Hill puts definite purpose at the center of his success philosophy.'],
      ['Give it edges', 'Here is a practical adaptation: name an outcome, a reason it matters, and the next action you can control. “Build an emergency buffer” becomes a plan when you specify a target and a first step.'],
      ['Try it today', 'Write: “I want ___ because ___. This week I will ___.” Review whether the action happened. Treat this as a planning exercise; clear intentions do not guarantee money or remove outside constraints.'],
    ], 'What turns a vague ambition into a usable plan?', 'A specific outcome, a reason, and a next action you can actually take.', 'Hill’s book is a motivational philosophy. Claims that thought alone attracts wealth are not established scientific findings.'),
  lesson('hill-persistence', 'practice', 'Keep the purpose. Inspect the plan.', 'Think and Grow Rich · Persistence', 'Napoleon Hill',
    'https://www.naphill.org/uncategorized/ezine-758-7-23-21/', ['goals', 'planning', 'persistence', 'Napoleon Hill', 'self improvement'], [
      ['The useful distinction', 'Hill connects persistence with definite plans, accurate knowledge, and cooperation. A practical reading is that continued effort needs information, not just enthusiasm.'],
      ['An everyday example', 'You send ten similar pitches and nobody replies. Before sending a hundred more, examine the audience, the offer, and the request. Ask someone knowledgeable to critique one.'],
      ['A bounded experiment', 'Change one part, try a small new batch, and set a review date. Decide in advance when to change course or stop. Persistence is a framework for action, not proof that every goal is achievable.'],
    ], 'How can you be persistent without repeating an ineffective method?', 'Keep reviewing evidence, adjust the plan, and set a point to reassess the goal.'),
  lesson('covey-influence', 'practice', 'Find the part you can actually move.', 'The 7 Habits · Circle of Influence', 'Stephen R. Covey · FranklinCovey',
    'https://www.franklincovey.com/courses/the-7-habits/habit-1/', ['goals', 'agency', 'Stephen Covey', 'self improvement'], [
      ['The mental loop', 'You keep replaying a decision someone else made. Covey distinguishes concerns you care about from things you can influence.'],
      ['Make two columns', 'For a delayed project, “the client signs today” is outside your control. “Send a clear summary of the unresolved decision” is an action you can take. Some problems need collective action, not a solo attitude change.'],
      ['Use it', 'Name the concern, then choose one influenceable step. You can still care about the larger problem while putting today’s effort somewhere it can produce information or movement.'],
    ], 'What belongs in your Circle of Influence?', 'Actions and relationships you can affect, even when you cannot control the final outcome.'),
  lesson('covey-big-rocks', 'practice', 'Schedule the important thing before the noise.', 'The 7 Habits · Put First Things First', 'Stephen R. Covey · FranklinCovey',
    'https://www.franklincovey.com/courses/the-7-habits/habit-3/', ['planning', 'priorities', 'Stephen Covey', 'self improvement'], [
      ['Urgency steals the day', 'Messages arrive with built-in demands for attention. Exercise, relationships, and skill building can matter deeply without sending you a notification.'],
      ['Covey’s distinction', 'Habit 3 asks you to put important priorities into practice. Separate what is urgent from what serves your long-term roles and goals; the two categories overlap, but they are not identical.'],
      ['A small implementation', 'Before filling next week with requests, reserve one realistic block for a priority you keep postponing. Leave room for real emergencies. At week’s end, check whether the block survived and what got in its way.'],
    ], 'Why schedule an important activity before it becomes urgent?', 'Otherwise immediate demands can consume the time it needs.'),
  lesson('covey-understand', 'mind', 'Check their meaning before giving your solution.', 'The 7 Habits · Seek First to Understand', 'Stephen R. Covey · FranklinCovey',
    'https://www.franklincovey.com/courses/the-7-habits/habit-5/', ['conversation', 'listening', 'Stephen Covey', 'self improvement'], [
      ['The advice reflex', 'A friend says work is exhausting. You immediately recommend a new job. But perhaps they enjoy the job and are struggling with one confusing expectation.'],
      ['Listen for their meaning', 'Covey’s fifth habit puts understanding before being understood. An everyday application: “It sounds like the unclear expectations are wearing you out. Have I got that right?”'],
      ['Then choose the next move', 'Let them correct your summary. Ask whether they want ideas or just someone to listen. Understanding someone’s view does not require agreeing with every claim they make.'],
    ], 'What should come before your advice?', 'Understand their meaning and check that your interpretation is accurate.'),
  lesson('carnegie-interest', 'mind', 'Follow the detail they care about.', 'How to Win Friends and Influence People · Genuine interest', 'Dale Carnegie Training',
    'https://www.dalecarnegie.com/en/dalecarnegieprinciples/how-to-be-social-at-work', ['conversation', 'listening', 'Dale Carnegie', 'self improvement'], [
      ['A conversation opening', 'Someone mentions restoring an old motorcycle. You could switch to your own story, or ask, “What was the hardest part to get working?”'],
      ['Carnegie’s principle', 'Take genuine interest in other people. A follow-up tied to what they just said shows you were listening and gives them a direction they can choose to explore.'],
      ['Make it reciprocal', 'Listen to the answer, share something relevant, and leave space for them to ask about you. Curious conversation is an exchange; rapid-fire questions can feel like an interview.'],
    ], 'What makes a follow-up question show real attention?', 'It connects to a detail the person actually shared, and you listen to their answer.'),
  lesson('carnegie-appreciation', 'mind', '“Good job” is missing the good part.', 'How to Win Friends and Influence People · Appreciation', 'Dale Carnegie Training',
    'https://www.dalecarnegie.com/en/dalecarnegieprinciples/how-to-be-interesting-person', ['conversation', 'leadership', 'Dale Carnegie', 'self improvement'], [
      ['The vague compliment', '“You’re awesome” may be kind, but it does not tell someone which action helped. Carnegie emphasizes honest, sincere appreciation.'],
      ['Name the contribution', 'Try: “Your diagram made the wiring change clear enough for me to catch the mismatch before testing.” You identify an observable action and its effect.'],
      ['Keep it honest', 'Use appreciation when you actually mean it. Do not attach a hidden request or inflate something trivial. Specificity helps someone see what you value without guessing.'],
    ], 'What makes appreciation more informative than generic praise?', 'Naming a real action and the concrete difference it made.'),
  lesson('clear-two-minutes', 'practice', 'Make the first two minutes almost absurdly easy.', 'Atomic Habits · Two-Minute Rule', 'James Clear',
    'https://jamesclear.com/how-to-stop-procrastinating', ['habits', 'James Clear', 'self improvement'], [
      ['Shrink the doorway', 'James Clear recommends scaling a new habit’s opening action to two minutes or less. The point is to practice starting, rather than demand the complete routine immediately.'],
      ['An everyday version', '“Work out four days” is the goal. “Put on gym shoes after work” is a repeatable start. Choose a doorway that really leads toward the behavior you want.'],
      ['Then build', 'Once starting becomes reliable, gradually extend the routine. A tiny action is a beginning; it does not replace the practice or effort required for the larger goal.'],
    ], 'What is the Two-Minute Rule meant to make easier?', 'Starting a behavior consistently, so you can build a fuller routine from it.'),
  lesson('newport-deep-break', 'practice', 'Your break can hijack the next hour.', 'Deep Work · Deep breaks', 'Cal Newport',
    'https://calnewport.com/on-deep-breaks/', ['focus', 'attention', 'Cal Newport', 'self improvement'], [
      ['The five-minute trap', 'You pause difficult work to check one social feed. That opens the familiar sequence: messages, another feed, then a headline. Returning to the task now takes effort.'],
      ['Newport’s advice', 'During focused work, choose breaks that do not launch an absorbing distraction ritual. Rest and entertainment both have a place; this advice concerns breaks between periods of concentration.'],
      ['Try a different break', 'Stand up, get water, or look outside. Before resuming, name the next small step in your task. Compare how easily you restart with and without a feed check.'],
    ], 'What should you avoid in a break between focused work periods?', 'A distraction that launches a familiar, absorbing browsing routine.'),
  lesson('robbins-state', 'mind', 'Change the question you are rehearsing.', 'Tony Robbins · Focus, physiology and language', 'Tony Robbins',
    'https://www.tonyrobbins.com/de/ask-tony/how-to-achieve-everything', ['focus', 'motivation', 'Tony Robbins', 'self improvement'], [
      ['Catch the loop', '“Why do I always screw this up?” directs your attention toward a familiar verdict. Robbins teaches changing focus, physical state, and the language you use.'],
      ['A practical experiment', 'Stand up or move comfortably for a moment. Then replace the verdict with: “What is the smallest useful step I can take next?” Name an actual action rather than forcing a positive mood.'],
      ['Check what happened', 'Try the action, then ask whether the change helped you start. This is a coaching exercise, not a medical treatment or proof that attitude can solve every problem.'],
    ], 'What makes a replacement question useful?', 'It directs attention toward a specific next action instead of a sweeping judgment about yourself.'),
  lesson('ghost-army', 'culture', 'The Army that brought inflatable tanks to a real war.', 'The Ghost Army · World War II', 'U.S. Army · Fort Leonard Wood',
    'https://www.army.mil/article/247350/fort_leonard_wood_examines_wwii_ghost_army_deception_tactics', ['history', 'World War II', 'deception', 'military'], [
      ['The strange job', 'The U.S. Army’s 23rd Headquarters Special Troops included roughly 1,100 people whose job was to make the enemy perceive forces that were not really there.'],
      ['More than rubber tanks', 'Inflatable vehicles supplied a visual clue. Recorded sounds, false radio traffic, and impersonation helped make the illusion consistent across different kinds of observation.'],
      ['Why the details matter', 'A decoy tank alone could look suspicious. Several apparently confirming signals made a larger formation more believable. This was dangerous frontline work, not a harmless theater production.'],
    ], 'What made the Ghost Army’s deception more convincing than inflatable tanks alone?', 'Coordinated visual, sound, radio, and impersonation cues suggested a coherent military presence.'),
  lesson('mincemeat', 'culture', 'A dead man carried a fake invasion plan.', 'Operation Mincemeat · 1943', 'Imperial War Museums',
    'https://www.iwm.org.uk/sites/default/files/files/2023-10/spies_large_print_guide.pdf', ['history', 'World War II', 'deception', 'intelligence'], [
      ['The unlikely courier', 'In 1943, British planners placed false military documents on a dead body and released it off the Spanish coast. The real Allied invasion target was Sicily.'],
      ['The false destination', 'The documents were meant to suggest an assault elsewhere. After they reached German intelligence, extra forces went to Sardinia, Greece, and the Balkans.'],
      ['The mechanism', 'The trick depended on the documents looking like an accidental discovery, rather than an enemy message asking to be believed. Mincemeat helped the deception around Sicily; it was one part of a much larger campaign.'],
    ], 'Why use supposedly lost documents instead of simply announcing a false target?', 'An apparently accidental discovery could seem more credible than an obvious message from the enemy.'),
  lesson('skinner-pigeons', 'culture', 'A psychologist tried putting pigeons in a missile.', 'Project Pigeon · A surviving prototype', 'Smithsonian National Museum of American History',
    'https://www.si.edu/object/nmah_690069', ['history', 'animals', 'learning', 'B. F. Skinner', 'military'], [
      ['Yes, actual pigeons', 'During World War II, psychologist B. F. Skinner proposed a missile nose cone with compartments for three trained pigeons. A surviving prototype is held by the Smithsonian.'],
      ['Behavior as a component', 'The birds were to peck at a target visible through windows. The proposal attempted to turn a trained animal response into part of a weapons system.'],
      ['Proposal versus service', 'This was experimental work, not a pigeon-guided weapon that fought in the war. Its place in the history of animal training is real even though the weapon was never developed into service.'],
    ], 'What distinction keeps the Project Pigeon story accurate?', 'A real prototype and training proposal existed; it was not an operational wartime weapon.'),
  lesson('dazzle-ships', 'culture', 'The camouflage that made ships louder.', 'Dazzle camouflage · World War I', 'National Museum of the U.S. Air Force',
    'https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/627585/dazzle-camouflage-on-troop-ships/', ['history', 'perception', 'military', 'design'], [
      ['Impossible to miss', 'Some World War I ships were covered in bold, clashing geometric patterns. They were not trying to blend quietly into the ocean.'],
      ['The attacker’s problem', 'A submarine crew needed to estimate a ship’s motion to aim a torpedo. Dazzle patterns were intended to make the vessel’s shape, size, and movement harder to judge.'],
      ['The clever reversal', 'Concealing a ship and confusing a reading of that ship are different goals. Dazzle targeted the second problem. Its intended mechanism should not be confused with proof that every pattern worked.'],
    ], 'What was dazzle camouflage intended to confuse?', 'An observer’s estimate of a ship’s shape and motion, rather than simply hiding the vessel.'),
];
