// The readings and library use the same source notes and evidence links.
export function evidenceDetails(card, escape) {
  const links = (card.related || []).map(source =>
    '<li><a href="' + escape(source.url) + '" target="_blank" rel="noopener noreferrer">'
    + escape(source.title) + '</a><span> · ' + escape(source.byline) + '</span></li>').join('');
  if (!card.context && !links) return '';
  return '<details class="evidence-notes"><summary>Behind the story</summary>'
    + (card.context ? '<p>' + escape(card.context) + '</p>' : '')
    + (links ? '<ul>' + links + '</ul>' : '') + '</details>';
}
