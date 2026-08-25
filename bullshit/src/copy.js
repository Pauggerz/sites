// $BULLSHIT — a nature documentary about one black bull, played completely
// straight. Deadpan, agricultural, faintly biblical. Short declaratives. Farm
// vocabulary with unearned gravity: the herd, the yield, the feed, the harvest.
// The joke is the straight face — nothing here winks or explains itself.
//
// Never: price, market cap, returns, gains, "up only", or anything implying
// money made. No roadmap, utility, or partnership claims. Never words
// attributed to Ansem or anything implying he endorses this — parody the bull,
// never quote the man. No toilet humor for its own sake: one scatological word
// in the ticker, everything else played completely straight.
export const BEATS = {
  bull: {
    index: '01 / THE BLACK BULL',
    title: 'THE BLACK BULL.',
    body: 'He has always been here. The barn was raised for him and the light was hung for him. He does not explain. He does not apologize. He is the bull.',
    label: '01 — THE BLACK BULL',
    nav: 'THE BULL',
  },
  drop: {
    index: '02 / THE SHIT',
    title: 'THE SHIT.',
    body: 'All the power in the world, and he holds it in one hand. Do not touch it.',
    label: '02 — THE SHIT',
    nav: 'THE SHIT',
  },
  field: {
    index: '03 / IT GROWS',
    title: 'IT GROWS.',
    body: 'Nobody planted this. It spread on its own. It has not stopped since.',
    label: '03 — IT GROWS',
    nav: 'THE FIELD',
  },
  board: {
    index: '04 / THE HERD',
    title: 'THE HERD.',
    body: 'Nothing was promised. Everything was recorded. The herd is counted. The herd is fed. The herd is accounted for.',
    label: '04 — THE HERD',
    nav: 'THE HERD',
  },
  gate: {
    index: '05 / THE GATE',
    title: 'THE GATE.',
    body: 'The gate is open. Accelerate.',
    label: '05 — THE GATE',
    nav: 'THE GATE',
    cta: true,
  },
}

// nav dock order — spatial narrative through the barn and out the door
export const NAV_ORDER = ['bull', 'drop', 'field', 'board', 'gate']

export const GATE_LINES = ['The bull provides']

// text drawn into the scene's canvas textures (materials.js) — posters,
// notes, sack labels, the ear tag, the board's idle screen. Same voice, same
// rules: deadpan, agricultural, never winks.
export const SCENE_TEXT = {
  posterHerd: {
    title: 'THE HERD',
    sub: 'COUNTED. FED.',
    sub2: 'ACCOUNTED FOR.',
    foot: 'EVERY NAME IN THE BOOK',
  },
  posterFeed: {
    title: 'BULL FEED',
    stamp: '50 LB',
    sub: 'PROVIDES ALL DAY.',
    foot: 'SINCE THE BEGINNING',
  },
  posterWanted: {
    title: 'WANTED',
    sub: 'ONE BLACK BULL',
    sub2: 'ANSWERS TO NOTHING',
    foot: 'APPROACH ON FOOT',
  },
  posterNotice: {
    title: 'NOTICE',
    sub: 'NO EXPLANATIONS',
    sub2: 'NO APOLOGIES',
    foot: 'BY ORDER OF THE BULL',
  },
  notes: ['DAY 41. IT GREW.', 'HEADCOUNT: ALL.', 'GATE OPEN. FIELD FINE.', 'RAIN CAME. GOOD.'],
  sack: { title: 'BULL FEED', sub: 'NET WT 50 LB' },
  tag: { number: '01', brand: '$BULLSHIT' },
  caTag: { title: 'CA', hint: 'TAP TO COPY' },
  boardIdle: { title: '$BULLSHIT', sub: 'STAND BY. THE HERD IS GRAZING.' },
}

// the origin story is split across two altitudes: the six piles carry the
// grounded, procedural parts (found by hovering/tapping, same as before);
// the three the story roots itself before the field ever existed — the
// bull, the mascot, the fact that it hasn't stopped — read as myth instead
// of field notes, so they went up into the constellation over the field
// (STAR_LORE) rather than staying underfoot. Same voice as BEATS either way:
// no names, no numbers, no claim that anyone real endorsed this. What
// actually happened is kept, but Ansem is never named or quoted, and the
// burn total is never given a figure — both would put words or a hard
// number in a real person's mouth, which the house rule above forbids even
// here.
export const PILE_LORE = [
  {
    title: 'WHAT HE PRODUCES',
    body: 'Above all else, one thing. The field is only proof of the volume.',
  },
  {
    title: 'BURIED, THEN FOUND',
    body: 'Launched deep in a wall of tickers, unlabeled among hundreds. Found anyway. Word of mouth. Feed instinct.',
  },
  {
    title: 'THE BURN',
    body: 'The herd did not wait for a name. It organized, pooled what it had, and burned it to reach the gold tier. No one asked why.',
  },
  {
    title: 'THE RECORD',
    body: 'It was noted, once, from higher up the chain, that this herd was first to put up a proper page and keep it fed. Nothing more was said. Nothing more was needed.',
  },
  {
    title: 'THE MISSION',
    body: "There isn't one. There is a joke, and the joke has outlasted every mission statement written near it.",
  },
  {
    title: 'THE FIELD CREW',
    body: 'Poorgoat. Dior. Chairman. LJC. The trenches. Names on a barn beam, not a whitepaper — the herd runs on people.',
  },
]

export const STAR_LORE = [
  {
    title: 'THE BLACK BULL',
    body: 'Before the field, there was the bull. Bottom-called, fully bought in, never explaining itself. The market took that conviction and made noise of it.',
  },
  {
    title: 'THE MASCOT',
    body: 'A bull that produces gold. Nothing metaphorical about it. That is the whole animal, the whole joke, the whole operation.',
  },
  {
    title: 'STILL GROWING',
    body: "Nobody planted this on purpose. It kept spreading anyway... on the ground, and now written above it too.",
  },
]

// TODO(launch): hard facts from BRIEF.md — never invent a value. Placeholders
// stay visible in the build until the real ones land.
export const CONTRACT_ADDRESS = 'zj1jpp7QMveWHLs61vL9KMZf254KvW7j4AAmBF8ry2k'

// TODO(launch): community link (Telegram)
export const JOIN_URL = ''

// TODO(launch): chart link — labeled "$BULLSHIT ↗", never "buy"
export const TOKEN_URL = 'https://dexscreener.com/solana/cd5hdt23sjgud5vtwsv51bmpey2qf9qh5cyswwmjbddq'

export const SOCIALS = [
  { label: 'X / TWITTER', url: 'https://x.com/BULLSHIT_ANSEM' },
  { label: 'CHART', url: 'https://dexscreener.com/solana/cd5hdt23sjgud5vtwsv51bmpey2qf9qh5cyswwmjbddq' },
  { label: 'TELEGRAM', url: '' },
]
