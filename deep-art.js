function whale(beat) {
  return `<path d="M50 207q27-10 43-29 46-43 142-43 36 0 58 22 10 8 16 19 41 7 41 25 0 21-59 33-64 24-132 5-39-11-69-37-20 13-41 6 15-5 15-23-6-13-23-23 26 1 44 17" fill="var(--paper-light)" stroke="var(--glow)" stroke-width="2"/>
    <path d="M182 235q-4 30 43 27l-12-21" fill="var(--paper-light)" stroke="var(--glow)" stroke-width="2"/>
    <path d="M300 193h3m14 13q16 6 27-4" stroke="var(--deep)" stroke-width="3" stroke-linecap="round"/>
    <path class="art-flow" d="M41 269q23-14 46 0t46 0 46 0 46 0 46 0 46 0 46 0" fill="none" stroke="var(--glow)" opacity=".5"/>
    ${beat ? '<g class="art-signal" fill="none" stroke="var(--glow)" stroke-width="2"><path d="M101 109h31l8-25 14 47 17-31 10 9h38m15 0h31l7-7 8 9 10-4h25"/><circle cx="280" cy="172" r="21" opacity=".65"/></g>' : ''}`;
}

function gallery(beat) {
  return `<g transform="rotate(-9 200 183)">
    <rect x="89" y="85" width="223" height="205" rx="6" fill="var(--deep)" stroke="var(--glow)" stroke-width="3"/>
    <rect x="102" y="98" width="197" height="179" fill="var(--paper-light)"/>
    <path d="M120 240q44-131 112-107l-32 42 76 75z" fill="var(--deep)" opacity=".86"/>
    <path d="M109 176q43-53 153 21t-63 62m-63-146q79 116 151 6m-169 120 91-106" fill="none" stroke="var(--field)" stroke-width="5" stroke-linecap="round"/>
    <path d="M124 135l44 14-25 35-26-12zM232 224l41 8-25 25z" fill="var(--glow)" opacity=".9"/>
    ${beat ? '<path class="art-flow" d="M117 255 280 114m-15 2 16-3-2 17" fill="none" stroke="#f4745e" stroke-width="2"/>' : ''}
  </g>`;
}

function portraits(beat) {
  return `<g transform="rotate(-9 133 179)">
    <rect x="67" y="96" width="132" height="177" rx="12" fill="var(--paper-light)" stroke="var(--glow)" stroke-width="2"/>
    <circle cx="133" cy="159" r="29" fill="var(--field)"/>
    <path d="M90 241v-9q0-43 43-43t43 43v9" fill="var(--field)"/>
  </g><g transform="rotate(8 263 179)">
    <rect x="197" y="96" width="132" height="177" rx="12" fill="var(--deep)" stroke="var(--glow)" stroke-width="2"/>
    <circle cx="263" cy="159" r="27" fill="var(--glow)"/>
    <path d="M220 241v-9q0-43 43-43t43 43v9" fill="var(--glow)"/>
  </g>${beat ? '<path class="art-flow" d="M113 75q84-55 173-4m-14-19 16 21-24-2M285 293q-84 54-171 4m12 19-14-21 23 2" fill="none" stroke="var(--glow)" stroke-width="4" stroke-linecap="round"/>' : ''}`;
}

function octopus(beat) {
  const arms = [
    'M174 187q-28 30-75 22t-25 42', 'M180 193q-18 63-81 65t-26 23',
    'M194 194q13 36-34 62t-31 23', 'M201 197q-2 58 22 72t17 21',
    'M212 187q24 54 69 48t30 24', 'M218 183q54 45 90 20t24-37',
    'M217 174q41-20 60-2', 'M175 178q-24-20-54-11',
  ];
  return `<g fill="none" stroke="var(--glow)" stroke-linecap="round" stroke-width="9">${arms.map((arm,i) =>
    `<path class="art-flow" style="--delay:${i*42}ms" d="${arm}"/>`).join('')}</g>
    <path d="M165 173q-12-61 32-70 45 3 42 60-2 39-32 51-29 1-42-41z" fill="var(--paper-light)" stroke="var(--glow)" stroke-width="2"/>
    <circle cx="189" cy="163" r="5" fill="var(--deep)"/><circle cx="220" cy="163" r="5" fill="var(--deep)"/>
    <path class="art-signal" d="M${beat ? 320 : 290} 119q17-16 33 0-16 17-33 0l-13 10v-20z" fill="var(--paper-light)"/>`;
}

function signal(beat) {
  return `<path d="M91 125h218v126H91z" fill="var(--deep)" stroke="var(--glow)" stroke-width="2"/>
    <path d="M107 195h186m-154-57v98m31-98v98m30-98v98m30-98v98m31-98v98" stroke="var(--glow)" opacity=".28"/>
    <path class="art-flow" d="M106 195h43l10-9 8 18 12-46 9 70 10-100 12 119 10-78 11 33 13-7h44" fill="none" stroke="var(--glow)" stroke-width="3" stroke-linejoin="round"/>
    ${beat ? '<circle class="art-signal" cx="202" cy="189" r="53" fill="none" stroke="#ff8577" stroke-width="3"/>' : ''}`;
}

function crowd(beat) {
  const people = [[110,137],[202,122],[288,142],[148,207],[253,219],[202,255]];
  return people.map(([x,y],i) => `<g class="art-signal" style="--delay:${i*64}ms" transform="translate(${x} ${y})" fill="${beat && i%2 ? 'var(--paper-light)' : 'var(--glow)'}" opacity="${i%2 ? .97 : .67}">
      <circle cy="-17" r="17"/><path d="M-29 23V14q0-19 29-19t29 19v9z"/>
    </g>`).join('');
}

function bee(beat) {
  return `<path d="M86 256h228" stroke="var(--glow)" opacity=".35"/>
    <circle cx="${beat ? 275 : 267}" cy="218" r="35" fill="#8a553a" stroke="var(--glow)" stroke-width="3"/>
    <g class="art-drift" transform="translate(${beat ? 191 : 147} 181) rotate(-18)">
      <ellipse cx="-14" cy="-30" rx="15" ry="35" transform="rotate(-39)" fill="var(--paper-light)" opacity=".69"/>
      <ellipse cx="15" cy="-24" rx="14" ry="30" transform="rotate(34)" fill="var(--paper-light)" opacity=".77"/>
      <ellipse rx="42" ry="25" fill="var(--glow)"/><path d="M-27-18q12 19 1 35m10-39q15 22 2 45M3-24q15 22 3 47" fill="none" stroke="var(--deep)" stroke-width="7"/>
      <circle cx="34" r="13" fill="var(--deep)"/>
    </g>${beat ? '<path class="art-flow" d="M242 172q40-21 63 13m-14-5 16 7-1-16" fill="none" stroke="var(--glow)" stroke-width="3"/>' : ''}`;
}

function mountain(beat) {
  return `<path d="M31 261 143 111l37 48 58-86 134 188z" fill="var(--field)" stroke="var(--glow)" stroke-width="2"/>
    <path d="m89 183 54-72 38 49-18 17-17-20-18 8-9-14zm99-36 50-74 68 95-32-10-23 6-20-34-18 27z" fill="var(--paper-light)" opacity=".85"/>
    <path d="m135 248 20-32 24 32z" fill="#fc8d70" stroke="var(--deep)" stroke-width="2"/>
    ${beat ? '<path class="art-flow" d="M221 153q-6 46-62 63m10-14-12 16 19-1" fill="none" stroke="#fc8d70" stroke-width="4" stroke-linecap="round"/>' : ''}`;
}

function frog(beat) {
  return `<path d="M63 234q106-143 274-81-68 163-222 143l-47 12 34-30z" fill="var(--field)" stroke="var(--glow)" stroke-width="2"/>
    <path d="M101 276q86-71 216-115" fill="none" stroke="var(--glow)" opacity=".65"/>
    <g transform="translate(205 181) rotate(-24)" fill="var(--paper-light)" stroke="var(--glow)" stroke-width="1.5">
      <path d="M-43 12l-36 21 7 12 47-13m59-26 39 18-3 11-44-8M-34-6l-42-30 9-10 43 26m49-10 35-29 12 9-31 36" fill="none" stroke-width="6" stroke-linecap="round"/>
      <ellipse rx="51" ry="34" opacity="${beat ? .44 : .84}"/><circle cx="38" cy="-19" r="13"/><circle cx="46" cy="12" r="13"/>
      <circle cx="40" cy="-19" r="5" fill="var(--deep)"/><circle cx="49" cy="12" r="5" fill="var(--deep)"/>
      <ellipse class="art-signal" cx="-9" cy="7" rx="${beat ? 19 : 9}" ry="${beat ? 13 : 6}" fill="#fd7869"/>
    </g>`;
}

export const DEEP_ART = { whale, gallery, portraits, octopus, signal, crowd, bee, mountain, frog };
