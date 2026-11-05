import { DEEP_ART } from './deep-art.js?v=6';

const PLANE = 'M200 51c-9 0-13 17-16 40l-9 69-88 49v18l85-22 9 56-35 21v14l54-12 54 12v-14l-35-21 9-56 85 22v-18l-88-49-9-69c-3-23-7-40-16-40Z';

function plane(beat) {
  const hits = [[101,219],[120,212],[135,207],[150,198],[160,204],[166,186],[239,195],
    [248,206],[265,205],[283,214],[296,219],[158,285],[238,283]];
  return `<g transform="translate(-20 -7) scale(1.1)">
    <path d="${PLANE}" transform="translate(9 14)" fill="#080c16" opacity=".62"/>
    <path d="${PLANE}" fill="var(--paper-light)" stroke="var(--glow)" stroke-width="1.5"/>
    <path d="M200 61v219m-100-63 84-23m116 23-84-23M185 119h30" fill="none" stroke="var(--deep)" opacity=".46"/>
    <path d="M190 112q10-22 20 0l3 14h-26Z" fill="var(--deep)" opacity=".89"/>
    ${hits.map(([x,y],i) => `<circle class="art-signal" style="--delay:${i*53}ms" cx="${x}" cy="${y}" r="${beat ? 2.3 : 3.6}" fill="#fb5242" opacity="${beat ? .62 : 1}"/>`).join('')}
    ${beat ? '<g class="art-signal" fill="none" stroke="var(--glow)" stroke-width="2"><circle cx="200" cy="119" r="26"/><circle cx="200" cy="119" r="37" opacity=".57" stroke-dasharray="4 5"/><path d="M224 111h34l19-17h45M175 127h-44l-15 14H82"/></g>' : ''}
  </g>`;
}

function memory(beat) {
  const page = 'M82 112q72-10 118 22 50-35 118-22v123q-72 2-118 43-52-41-118-43Z';
  return beat === 0
    ? `<path d="${page}" fill="#080e0a" opacity=".62" transform="translate(8 15)"/>
      <path d="${page}" fill="var(--paper-light)" stroke="var(--glow)" stroke-width="2"/>
      <path d="M200 134v144M109 142q39 1 68 16m-68 9q39 1 68 16m-68 9q39 1 68 16m45-51q27-18 66-17m-66 42q27-18 66-17m-66 42q27-18 66-17" fill="none" stroke="var(--deep)" opacity=".59" stroke-width="2.5" stroke-linecap="round"/>
      <path class="art-flow" d="M226 230q28-16 57-17" fill="none" stroke="var(--deep)" stroke-width="5" opacity=".62"/>`
    : `<path d="M104 147 210 111l95 70-103 65z" fill="#080e0a" opacity=".72" transform="translate(7 17)"/>
      <path d="M104 147 210 111l95 70-103 65z" fill="var(--paper-light)" stroke="var(--glow)" stroke-width="2"/>
      <path d="M104 147v31l98 73 103-62v-8l-103 65z" fill="var(--deep)" stroke="var(--glow)" stroke-width="1.5"/>
      <path class="art-signal" d="${beat === 1 ? 'M185 166q-2-20 21-25 26-5 31 14 4 12-12 21-11 6-11 12m0 9v2' : 'm182 167 21 19 43-43'}" fill="none" stroke="var(--deep)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M84 145H61m23 15-23 10m252-49 15-13m-14 26 21 3" stroke="var(--glow)" stroke-width="2" opacity=".63"/>`;
}

function moon(beat) {
  const shift = [-59, 0, 59][beat] ?? 0;
  return `<ellipse cx="200" cy="196" rx="146" ry="84" fill="none" stroke="var(--glow)" stroke-dasharray="3 8" opacity=".53" transform="rotate(-19 200 196)"/>
    <circle cx="200" cy="193" r="97" fill="var(--paper-light)" opacity=".11"/>
    <circle cx="200" cy="193" r="81" fill="var(--deep)" stroke="var(--glow)" stroke-width="1.1"/>
    <path d="M200 112A81 81 0 0 1 200 274C${200+shift} 240 ${200+shift} 147 200 112Z" fill="var(--paper-light)"/>
    <g fill="var(--deep)" opacity=".25"><circle cx="230" cy="151" r="13"/><circle cx="252" cy="191" r="16"/><circle cx="221" cy="233" r="11"/><circle cx="258" cy="220" r="6"/></g>
    <circle class="art-signal" cx="315" cy="123" r="7" fill="var(--glow)"/>`;
}

function ocean(beat) {
  const lines = Array.from({ length: 8 }, (_, i) =>
    `<path class="art-flow" style="--delay:${i*92}ms" d="M25 ${189+i*10}C102 ${75+i*13} 136 ${291+i*7} 251 ${196+i*9}S323 ${73+i*11} 389 ${108+i*9}" stroke="var(--${i%2 ? 'paper-light' : 'glow'})" opacity="${.31+i*.07}" stroke-width="${i%3 ? 1.7 : 2.8}"/>`);
  return `<g fill="none" stroke-linecap="round">${lines.join('')}
    ${beat ? '<path class="art-signal" d="M176 180c-24-45 81-72 90-19 8 49-74 66-76 26-2-25 51-38 56-11 3 14-18 22-25 10" stroke="var(--glow)" stroke-width="4"/><circle cx="221" cy="186" r="6" fill="var(--paper-light)"/>' : ''}
  </g>`;
}

function habit(beat) {
  return `<g transform="rotate(-8 200 194)">
    <ellipse cx="123" cy="254" rx="70" ry="13" fill="#080e18" opacity=".57"/>
    <path d="M164 162h13c39 0 30 53-2 53h-22" fill="none" stroke="var(--glow)" stroke-width="9"/>
    <path d="M71 151h101l-11 63c-7 37-74 37-80 0z" fill="var(--paper-light)" stroke="var(--glow)" stroke-width="2"/>
    <ellipse cx="121" cy="150" rx="50" ry="11" fill="var(--deep)" stroke="var(--glow)" stroke-width="2"/>
    <path class="art-flow" d="M102 130q-22-23 0-46m22 47q-21-23 0-46m22 47q-20-23 0-46" fill="none" stroke="var(--glow)" opacity=".68" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="235" y="132" width="81" height="120" rx="15" fill="var(--deep)" stroke="var(--glow)" stroke-width="2"/>
    <rect x="245" y="145" width="61" height="88" rx="7" fill="var(--glow)" opacity="${beat ? .78 : .16}"/>
    <circle cx="275" cy="241" r="3" fill="var(--glow)"/>
    ${beat ? '<path class="art-signal" d="M185 133q22-22 43-9m-12-14 14 16-21 2" fill="none" stroke="var(--glow)" stroke-width="3"/><path d="m261 189 10 10 20-25" fill="none" stroke="var(--deep)" stroke-width="4"/>' : '<path d="M261 182h24m-24 13h16" stroke="var(--glow)" stroke-width="2"/>'}
  </g>`;
}

function metric(beat) {
  return `<g transform="rotate(-8 200 195)">
    <rect x="65" y="106" width="272" height="166" rx="16" fill="var(--deep)" stroke="var(--glow)" stroke-width="1.6"/>
    <path d="M86 241h230m-230-39h230m-230-38h230m-230-38h230" fill="none" stroke="var(--glow)" opacity=".25"/>
    ${[31,45,59,81,105].map((height,i) => `<rect x="${108+42*i}" y="${241-height}" width="24" height="${height}" rx="4" fill="var(--glow)" opacity="${.42+i*.13}"/>`).join('')}
    <path class="art-flow" d="${beat ? 'M97 158q49-7 96 11t102 55' : 'm112 193 46-22 35 7 52-48 57-22'}" fill="none" stroke="var(--paper-light)" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

function clock(beat) {
  return `<circle cx="200" cy="189" r="108" fill="var(--deep)" stroke="var(--glow)"/>
    <circle cx="200" cy="189" r="94" fill="none" stroke="var(--glow)" opacity=".46" stroke-dasharray="1 7"/>
    <path d="M200 104a85 85 0 0 1 85 85" fill="none" stroke="var(--glow)" opacity=".42" stroke-width="15" stroke-linecap="round"/>
    <path d="M200 103v16m0 140v16m-86-86h16m140 0h16" fill="none" stroke="var(--paper-light)" stroke-width="2"/>
    <path d="M200 189v-54m0 54h${beat ? -52 : 60}" transform="rotate(${beat*51-25} 200 189)" fill="none" stroke="var(--paper-light)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="200" cy="189" r="8" fill="var(--glow)"/>
    <circle class="art-signal" cx="294" cy="119" r="8" fill="var(--glow)"/>`;
}

function network(beat) {
  const points = [[91,154],[153,100],[200,189],[293,115],[307,227],[150,271],[70,243]];
  return `<path d="M91 154 153 100 200 189 293 115 307 227 200 189 150 271 70 243zM91 154l109 35M70 243l130-54" fill="none" stroke="var(--glow)" opacity=".54" stroke-width="2"/>
    ${beat ? '<path class="art-flow" d="M91 154l109 35 107 38" fill="none" stroke="var(--paper-light)" stroke-width="4"/>' : ''}
    ${points.map(([x,y],i) => `<circle cx="${x}" cy="${y}" r="${i===2?29:13}" fill="var(--deep)" stroke="var(--glow)" stroke-width="1.5"/><circle class="art-signal" style="--delay:${i*100}ms" cx="${x}" cy="${y}" r="${i===2?12:4}" fill="var(--paper-light)" opacity="${beat || i===2 ? 1 : .53}"/>`).join('')}`;
}

function lens(beat) {
  return `<path d="M62 189q136-145 276 0-140 145-276 0z" fill="var(--deep)" stroke="var(--glow)" stroke-width="1.6"/>
    <circle cx="${beat ? 226 : 186}" cy="189" r="65" fill="var(--glow)" opacity=".39"/>
    <circle cx="200" cy="189" r="43" fill="var(--paper-light)"/>
    <circle class="art-signal" cx="200" cy="189" r="${beat ? 13 : 22}" fill="var(--deep)"/>
    <path d="M200 80v29m0 160v29M51 189h-19m317 0h19" stroke="var(--glow)" stroke-width="1.5"/>`;
}

function orbit(beat) {
  return `<g transform="rotate(${beat*20-23} 200 189)">
    <circle cx="200" cy="189" r="67" fill="var(--paper-light)" opacity=".16" stroke="var(--glow)"/>
    <circle cx="200" cy="189" r="46" fill="var(--paper-light)" opacity=".85"/>
    <path d="M166 164c21-30 57-25 76 7l-14 14-23-5-7 19-29-10z" fill="var(--deep)" opacity=".59"/>
    <ellipse cx="200" cy="189" rx="139" ry="59" fill="none" stroke="var(--glow)" stroke-width="1.8" stroke-dasharray="3 4"/>
    <circle class="art-signal" cx="319" cy="157" r="10" fill="var(--glow)"/>
    <ellipse cx="200" cy="189" rx="100" ry="112" fill="none" stroke="var(--glow)" opacity=".39"/>
  </g>`;
}


function dialogue(beat) {
  return `<g fill="var(--deep)" stroke="var(--glow)" stroke-width="2">
    <path d="M65 86h186a24 24 0 0 1 24 24v75a24 24 0 0 1-24 24H126l-42 30 7-30H65a24 24 0 0 1-24-24v-75a24 24 0 0 1 24-24Z"/>
    <path d="M190 170h130a24 24 0 0 1 24 24v62a24 24 0 0 1-24 24h-8l8 28-43-28h-87a24 24 0 0 1-24-24v-62a24 24 0 0 1 24-24Z" fill="var(--field)"/>
    <path d="M82 127h143m-143 23h101m-101 23h65" opacity=".65"/>
    ${[0,1,2].map(i => `<circle class="art-signal" style="--delay:${i*150}ms" cx="${213+i*33}" cy="225" r="${beat===i?9:5}" fill="var(--paper-light)" stroke="none"/>`).join('')}
    <path class="art-flow" d="m89 268 32 19 24-10" fill="none"/>
  </g>`;
}
function plan(beat) {
  return `<g transform="rotate(-8 200 188)">
    <rect x="103" y="66" width="205" height="250" rx="12" fill="var(--field)" stroke="var(--glow)"/>
    <rect x="83" y="54" width="205" height="250" rx="12" fill="var(--paper-light)"/>
    <path d="M119 93h131m-131 11h85" stroke="var(--deep)" stroke-width="5" opacity=".7"/>
    ${[0,1,2].map((i) => `<rect x="117" y="${137+i*48}" width="20" height="20" rx="3" fill="none" stroke="var(--deep)" stroke-width="2"/>
      <path d="M151 ${147+i*48}h91m-91 11h60" stroke="var(--deep)" stroke-width="3" opacity=".45"/>
      ${i<=beat?`<path class="art-flow" d="m119 ${146+i*48} 7 7 17-21" fill="none" stroke="var(--deep)" stroke-width="3"/>`:''}`).join('')}
    <path d="m253 236 14-10 47 66-5 22-18-9z" fill="var(--glow)" stroke="var(--deep)" stroke-width="2"/>
  </g>`;
}
function tank(beat) {
  return `<g stroke="var(--glow)" stroke-width="2">
    <path d="M56 260h294M78 278h255" opacity=".4" stroke-dasharray="5 7"/>
    <rect x="76" y="218" width="240" height="42" rx="21" fill="var(--deep)"/>
    ${[0,1,2,3,4,5].map(i=>`<circle cx="${101+i*37}" cy="239" r="12" fill="var(--field)"/>`).join('')}
    <path d="m83 219 25-47h168l34 47Z" fill="var(--field)"/>
    <path d="m145 172 10-44h75l16 44Z" fill="var(--field)"/>
    <path d="M231 141h100v12h-96" fill="var(--paper-light)"/>
    <path d="M166 132v33m35-33v33M113 185h162m-90-12v40" opacity=".45"/>
    <path d="m192 180 4 12h13l-10 7 4 13-11-8-10 8 4-13-11-7h13z" fill="var(--paper-light)" stroke="none"/>
    ${beat?'<path class="art-flow" d="M84 105q-22 38-8 76m241-72q25 38 7 76" fill="none" stroke-dasharray="4 6"/><text x="200" y="92" fill="var(--paper-light)" stroke="none" font-size="15" text-anchor="middle" letter-spacing="5">DECOY</text>':''}
  </g>`;
}
function pigeon(beat) {
  return `<g stroke="var(--glow)" stroke-width="2">
    <rect x="65" y="75" width="268" height="214" rx="90" fill="var(--deep)"/>
    <path d="M192 78v205" opacity=".4" stroke-dasharray="4 5"/>
    <path d="M116 236q-41-46-3-91 32-27 65 7l22 4-20 17q8 47-34 67l-30 20Z" fill="var(--paper-light)"/>
    <path d="M118 174q-20 35 23 41l21-39" fill="var(--field)"/>
    <circle cx="159" cy="150" r="4" fill="var(--deep)" stroke="none"/>
    <path d="m141 238 3 23m-22 0h36"/>
    <circle cx="259" cy="176" r="44" fill="var(--field)"/>
    <path d="M259 124v105m-52-53h104" opacity=".7"/>
    <circle class="art-signal" cx="${beat?259:278}" cy="${beat?176:162}" r="8" fill="var(--glow)"/>
  </g>`;
}
function ship(beat) {
  return `<g stroke="var(--glow)" stroke-width="2">
    <path d="M47 219h299l-46 46H95Z" fill="var(--paper-light)"/>
    <path d="M96 218v-43h169v43m-126-43v-31h81v31m-21-31v-35h19v35" fill="var(--field)"/>
    <path d="m110 220 48 44h43l-44-44Zm79 0 44 44h50l-45-44Z" fill="var(--deep)" stroke="none"/>
    <path d="m100 177 39 41h36l-38-41Zm82 0 38 41h30l-29-41Z" fill="var(--deep)" stroke="none"/>
    <path class="art-flow" d="M58 283q30-14 60 0t60 0 60 0 60 0 50 0" fill="none"/>
    <path d="M200 105v-38l40 13-40 10" fill="var(--glow)"/>
    ${beat?'<path class="art-flow" d="m61 111 43 36m172-33 52-27" fill="none" stroke-dasharray="3 5"/>':''}
  </g>`;
}
const ART = { dialogue, plan, tank, pigeon, ship, plane, memory, habit, metric, clock, moon, ocean, network, lens, orbit, ...DEEP_ART };

export function storyArt(kind, beat) {
  return `<svg viewBox="0 0 400 355" class="story-art" aria-hidden="true">
    <g fill="none" stroke="var(--glow)" stroke-width="1">
      <circle cx="200" cy="188" r="148" opacity=".27" stroke-dasharray="1.5 5"/>
      <circle cx="200" cy="188" r="130" opacity=".17"/>
      <path d="M40 188h320M200 29v320m-151-48h15m-7-7v14m280-235h15m-7-7v14" opacity=".22"/>
    </g>
    <g class="art-drift">${ART[kind](beat)}</g>
  </svg>`;
}
