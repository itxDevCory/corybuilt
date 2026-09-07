// THE SIGNAL — generated cover art. Used wherever a story has no photo yet (no PEXELS_API_KEY,
// or the backfill has not reached it). Same drawing code as the homepage Live Wire, so the two
// surfaces match. Deterministic per slug: the same story always gets the same picture.
import { beatById } from "./store.mjs";

function h32(str){ let h = 2166136261; for(let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed){ return function(){ seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const TOPICS = [
  { k:'PAYCHECK',       tone:'c', re:/\bpay\b|raise|salar|wage|paycheck|hiring|\bjobs?\b|layoff|worker|employ|career|income|manager/gi },
  { k:'REGULATION',     tone:'o', re:/\blaw\b|regulat|legislat|\bact\b|europe|\beu\b|\bban\b|\bfines?\b|court|complian|label|policy|senate|congress|\brules?\b/gi },
  { k:'CAPITAL',        tone:'o', re:/billion|trillion|capex|invest|spend|pouring|data ?cent|infrastructure|build-?out|\bchecks?\b|funding/gi },
  { k:'ROBOTICS',       tone:'c', w:1.6, re:/robot|humanoid|unitree|drone|hardware|android/gi },
  { k:'DATA & PRIVACY', tone:'o', re:/privacy|opt[- ]?in|consent|training data|surveil|scrap|uploads|tracking|personal data/gi },
  { k:'MARKETS',        tone:'c', re:/\bipo\b|stock|shares?\b|valuation|market|nasdaq|debut|oversubscrib|retail buyers|rally/gi },
  { k:'COMPUTE',        tone:'c', re:/\bchips?\b|\bgpus?\b|nvidia|compute|\bmodels?\b|openai|anthropic|google|\bllm|agents?\b/gi }
];
const BEAT_FALLBACK = { money:{ k:'PAYCHECK', tone:'c' }, policy:{ k:'REGULATION', tone:'o' }, tools:{ k:'COMPUTE', tone:'c' }, family:{ k:'FAMILY', tone:'o' } };
const BEAT_TONE = { money:'c', policy:'o', tools:'c', family:'o' };
function topicOf(s){
  let best = null, top = 0;
  const hl = s.headline || '', dk = s.dek || '';
  for(const t of TOPICS){
    const a = ((hl.match(t.re) || []).length * 3 + (dk.match(t.re) || []).length) * (t.w || 1);
    if(a > top){ top = a; best = t; }
  }
  if(!best) best = BEAT_FALLBACK[s.beat] || { k:'SIGNAL', tone:'c' };
  /* label: the editorial beat when the feed gives one, otherwise the detected topic */
  const label = s.beatLabel ? String(s.beatLabel).toUpperCase() : best.k;
  const tone = s.beat && BEAT_TONE[s.beat] ? BEAT_TONE[s.beat] : best.tone;
  return { k: best.k, label: label, tone: tone };
}
/* ---- cover art: one deterministic SVG per story, drawn in the site palette ---- */
function icon(k, C, O){
  switch(k){
    case 'PAYCHECK': return '<g transform="translate(160 100)">' +
      '<rect x="-56" y="8" width="18" height="30" fill="' + C + '" opacity=".35"/><rect x="-30" y="-8" width="18" height="46" fill="' + C + '" opacity=".55"/>' +
      '<rect x="-4" y="-26" width="18" height="64" fill="' + C + '" opacity=".8"/><rect x="22" y="-46" width="18" height="84" fill="' + C + '"/>' +
      '<polyline points="-52,-16 -22,-30 6,-46 34,-62" fill="none" stroke="' + O + '" stroke-width="3" stroke-linecap="round"/>' +
      '<polyline points="22,-64 36,-64 36,-50" fill="none" stroke="' + O + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="54" y="-52" font-family="ui-monospace,Menlo,monospace" font-size="30" font-weight="700" fill="#fff">$</text></g>';
    case 'REGULATION': return '<g transform="translate(160 100)">' +
      '<circle r="44" fill="none" stroke="' + O + '" stroke-width="3"/><circle r="36" fill="none" stroke="' + O + '" stroke-width="1.5" stroke-dasharray="4 5" opacity=".8"/>' +
      '<circle r="44" fill="' + O + '" opacity=".08"/>' +
      '<text y="12" text-anchor="middle" font-family="Georgia,serif" font-size="46" font-weight="700" fill="#fff">§</text>' +
      '<path d="M-90 -60 h44 M-90 -48 h30 M46 60 h44 M60 48 h30" stroke="' + C + '" stroke-width="2" opacity=".8"/></g>';
    case 'CAPITAL': return '<g transform="translate(160 100)">' +
      '<g fill="' + C + '"><rect x="-70" y="-10" width="30" height="60" opacity=".35"/><rect x="-34" y="-34" width="30" height="84" opacity=".6"/><rect x="2" y="-56" width="30" height="106" opacity=".85"/></g>' +
      '<g stroke="#050507" stroke-width="2"><path d="M-70 4 h30 M-70 18 h30 M-70 32 h30 M-34 -20 h30 M-34 -6 h30 M-34 8 h30 M-34 22 h30 M-34 36 h30 M2 -42 h30 M2 -28 h30 M2 -14 h30 M2 0 h30 M2 14 h30 M2 28 h30"/></g>' +
      '<path d="M44 50 v-90 l40 -22 M44 -40 h38" fill="none" stroke="' + O + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M84 -62 v26" stroke="' + O + '" stroke-width="2" stroke-dasharray="3 3"/><rect x="78" y="-36" width="12" height="10" fill="' + O + '"/></g>';
    case 'ROBOTICS': return '<g transform="translate(160 100)">' +
      '<path d="M0 -62 v-14" stroke="' + O + '" stroke-width="3"/><circle cy="-80" r="5" fill="' + O + '"/>' +
      '<rect x="-46" y="-60" width="92" height="76" rx="14" fill="#0a0a12" stroke="#fff" stroke-width="2.5"/>' +
      '<rect x="-30" y="-36" width="22" height="14" rx="3" fill="' + C + '"/><rect x="8" y="-36" width="22" height="14" rx="3" fill="' + C + '"/>' +
      '<path d="M-22 -4 h44" stroke="' + C + '" stroke-width="2" opacity=".7"/><path d="M-14 -4 v10 M0 -4 v10 M14 -4 v10" stroke="' + C + '" stroke-width="2" opacity=".7"/>' +
      '<path d="M-56 -30 h10 M46 -30 h10" stroke="#fff" stroke-width="2.5"/><path d="M-30 16 v22 h60 v-22" fill="none" stroke="#fff" stroke-width="2.5" opacity=".7"/></g>';
    case 'DATA & PRIVACY': return '<g transform="translate(160 100)">' +
      '<path d="M-80 0 Q0 -66 80 0 Q0 66 -80 0 Z" fill="none" stroke="#fff" stroke-width="2.5"/>' +
      '<circle r="26" fill="none" stroke="' + C + '" stroke-width="2" stroke-dasharray="5 4"/><circle r="14" fill="' + C + '"/><circle cx="-5" cy="-5" r="4" fill="#fff"/>' +
      '<path d="M-64 60 L64 -60" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/></g>';
    case 'MARKETS': return '<g transform="translate(160 100)" stroke-linecap="round">' +
      '<g stroke="' + O + '" stroke-width="2"><path d="M-70 -6 v40 M-42 -20 v50"/></g><rect x="-76" y="6" width="12" height="20" fill="' + O + '"/><rect x="-48" y="-8" width="12" height="28" fill="' + O + '"/>' +
      '<g stroke="' + C + '" stroke-width="2"><path d="M-14 -30 v56 M14 -44 v50 M42 -70 v54"/></g><rect x="-20" y="-18" width="12" height="36" fill="' + C + '"/><rect x="8" y="-32" width="12" height="30" fill="' + C + '"/><rect x="36" y="-58" width="12" height="36" fill="' + C + '"/>' +
      '<path d="M-78 22 L-44 8 L-8 -12 L20 -30 L46 -62 L74 -70" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 4" opacity=".8"/>' +
      '</g>';
    case 'COMPUTE': return '<g transform="translate(160 100)">' +
      '<g stroke="' + C + '" stroke-width="2.5"><path d="M-30 -56 v-14 M-10 -56 v-14 M10 -56 v-14 M30 -56 v-14 M-30 56 v14 M-10 56 v14 M10 56 v14 M30 56 v14 M-56 -30 h-14 M-56 -10 h-14 M-56 10 h-14 M-56 30 h-14 M56 -30 h14 M56 -10 h14 M56 10 h14 M56 30 h14"/></g>' +
      '<rect x="-56" y="-56" width="112" height="112" rx="8" fill="#0a0a12" stroke="#fff" stroke-width="2.5"/>' +
      '<rect x="-34" y="-34" width="68" height="68" rx="4" fill="none" stroke="' + O + '" stroke-width="2"/>' +
      '<text y="10" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="26" font-weight="700" fill="' + C + '" letter-spacing="2">AI</text></g>';
    case 'FAMILY': return '<g transform="translate(160 100)" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M-70 -6 L0 -64 L70 -6" stroke="#fff" stroke-width="3"/><path d="M-52 -18 V54 H52 V-18" stroke="#fff" stroke-width="2.5"/>' +
      '<rect x="-36" y="-2" width="24" height="22" fill="' + C + '" opacity=".9"/><rect x="12" y="-2" width="24" height="22" fill="' + C + '" opacity=".5"/>' +
      '<path d="M-10 54 V26 H10 V54" stroke="' + O + '" stroke-width="2.5"/>' +
      '<text x="0" y="-22" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="22" font-weight="700" fill="' + O + '">$</text></g>';
    default: return '<g transform="translate(160 100)" fill="none" stroke-linecap="round">' +
      '<circle r="7" fill="' + O + '"/><path d="M-28 -28 A40 40 0 0 0 -28 28" stroke="' + C + '" stroke-width="3"/><path d="M28 -28 A40 40 0 0 1 28 28" stroke="' + C + '" stroke-width="3"/>' +
      '<path d="M-50 -50 A70 70 0 0 0 -50 50" stroke="' + C + '" stroke-width="2.5" opacity=".6"/><path d="M50 -50 A70 70 0 0 1 50 50" stroke="' + C + '" stroke-width="2.5" opacity=".6"/>' +
      '<path d="M-72 -72 A100 100 0 0 0 -72 72" stroke="' + C + '" stroke-width="2" opacity=".3"/><path d="M72 -72 A100 100 0 0 1 72 72" stroke="' + C + '" stroke-width="2" opacity=".3"/></g>';
  }
}
function coverSVG_(s, t, i){
  const C = '#00f3ff', O = '#ff5e3a', A = t.tone === 'o' ? O : C, B = t.tone === 'o' ? C : O;
  const seed = h32(s.slug || s.headline || String(i)), r = rng(seed), id = 'g' + seed.toString(36);
  let bars = '';
  const nb = 7 + Math.floor(r() * 6);
  for(let k = 0; k < nb; k++){
    const x = Math.floor(r() * 320), w = 2 + Math.floor(r() * 4), y = Math.floor(r() * 200), h = 20 + Math.floor(r() * 90);
    bars += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + (r() > .7 ? B : A) + '" opacity="' + (0.08 + r() * 0.22).toFixed(2) + '"/>';
  }
  let dots = '';
  const nd = 10 + Math.floor(r() * 12);
  for(let k = 0; k < nd; k++){ dots += '<circle cx="' + Math.floor(r() * 320) + '" cy="' + Math.floor(r() * 200) + '" r="' + (1 + r() * 1.6).toFixed(1) + '" fill="#fff" opacity="' + (0.15 + r() * 0.5).toFixed(2) + '"/>'; }
  const gx = Math.floor(r() * 20), gy = Math.floor(r() * 20), rot = (r() * 40 - 20).toFixed(1), rot2 = (r() * 60 - 30).toFixed(1);
  const num = String((i + 1)).padStart(2, '0');
  return '<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#101018"/><stop offset="1" stop-color="#050507"/></linearGradient>' +
    '<radialGradient id="' + id + 'b" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="' + A + '" stop-opacity=".22"/><stop offset=".6" stop-color="' + A + '" stop-opacity="0"/></radialGradient>' +
    '<pattern id="' + id + 'g" width="20" height="20" patternUnits="userSpaceOnUse" x="' + gx + '" y="' + gy + '"><path d="M20 0 H0 V20" fill="none" stroke="#fff" stroke-opacity=".07"/></pattern>' +
    '<radialGradient id="' + id + 'v" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient></defs>' +
    '<rect width="320" height="200" fill="url(#' + id + 'a)"/><rect width="320" height="200" fill="url(#' + id + 'g)"/>' +
    '<g transform="rotate(' + rot + ' 160 100)">' + bars + '</g>' +
    '<rect width="320" height="200" fill="url(#' + id + 'b)"/>' +
    '<g transform="rotate(' + rot2 + ' 160 100)"><rect x="-40" y="86" width="400" height="28" fill="' + A + '" opacity=".07"/></g>' +
    dots +
    '<text x="306" y="186" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-size="60" font-weight="700" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1">' + num + '</text>' +
    (i === 0 ? icon(t.k, C, O) : '<g transform="translate(160 100) scale(1.32) translate(-160 -100)">' + icon(t.k, C, O) + '</g>') +
    '<rect width="320" height="200" fill="url(#' + id + 'v)"/>' +
    '<rect x="0" y="0" width="320" height="3" fill="' + A + '" opacity=".9"/></svg>';
}

export function coverSVG(story, i = 0) {
  const s = { ...story, beatLabel: story.beatLabel || beatById(story.beat).label };
  return coverSVG_(s, topicOf(s), i);
}
