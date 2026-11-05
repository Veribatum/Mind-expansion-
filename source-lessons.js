// Dynamic lessons retain the source's explanations and examples with attribution.
const explanation = /\b(because|therefore|causes?|caused|depends?|results? (?:in|from)|means? that|explains?|mechanism|leads? to|so that|allows?)\b/i;
const evidence = /\b(experiment|research|study|studies|observed|measured|tested|researchers|found that|evidence)\b/i;
const example = /\b(for example|for instance|such as|example of|imagine|consider|in one|in a study)\b/i;

function sentences(text) {
  if (typeof Intl.Segmenter === 'function') {
    return Array.from(new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text),
      part => part.segment.trim()).filter(Boolean);
  }
  return text.match(/[^.!?]+[.!?]+/g)?.map(line => line.trim()) || [];
}

function excerpt(paragraph) {
  const lines = sentences(paragraph);
  const selected = [];
  for (const line of lines) {
    if (selected.join(' ').length + line.length > 530) break;
    if (line.trim().split(/\s+/).length > 49) return '';
    if (!/[.!?]["”)]?$/.test(line)) break;
    selected.push(line);
    if (selected.join(' ').length >= 220) break;
  }
  const text = selected.join(' ');
  return text.length >= 100 ? text : '';
}

export function buildSourceLesson(title, extract) {
  const raw = extract.replace(/\[[\d, –-]+\]/g, '')
    .replace(/\{\\displaystyle[\s\S]*?\}/g, '');
  const paragraphs = raw.split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length >= 100 && !/\\[a-z]+\b|[{}]|https?:\/\//i.test(p));
  if (paragraphs.length < 3) return null;
  const candidates = paragraphs.map((text, index) => ({ text: excerpt(text), index })).filter(p => p.text);
  const lead = candidates[0];
  const why = candidates.find(p => p.index > lead?.index && explanation.test(p.text));
  const concrete = candidates.find(p => p !== why && p.index > lead?.index
    && (example.test(p.text) || evidence.test(p.text)));
  if (!lead || !why || !concrete) return null;

  const selected = [lead, why, concrete];
  const steps = selected.map((p, i) => ({
    label: i === 0 ? 'The concept' : i === 1 ? 'The explanation'
      : evidence.test(p.text) ? 'A research finding' : 'A concrete example',
    text: p.text,
  }));
  const takeaway = sentences(why.text).find(line => explanation.test(line)) || sentences(why.text)[0];
  return {
    title, takeaway, steps,
    question: 'Explain ' + title + ' using the mechanism and the example from this reading.',
    answer: why.text + '\n\n' + concrete.text,
  };
}
