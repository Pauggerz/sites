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
  notes: ['DAY 41. IT GREW.', 'HEADCOUNT: ALL.', 'GATE OPEN. FIELD FINE.', 'RAIN CAME. GOOD.'],
  sack: { title: 'BULL FEED', sub: 'NET WT 50 LB' },
  tag: { number: '01', brand: '$BULLSHIT' },
  caTag: { title: 'CA', hint: 'TAP TO COPY' },
  boardIdle: { title: '$BULLSHIT', sub: 'STAND BY. THE HERD IS GRAZING.' },
}

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
