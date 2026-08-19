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
    body: 'He stands where he has always stood. He asks for nothing. He explains nothing. The barn was raised around him and the light was hung for him, and he has never once looked at either.',
    label: '01 — THE BLACK BULL',
    nav: 'THE BULL',
  },
  drop: {
    index: '02 / THE SHIT',
    title: 'THE SHIT.',
    body: 'He lifts it. He does not set it down and he does not look at it. What the ground would have taken, he holds up instead — steady, at the height of his shoulder, for as long as anyone cares to look.',
    label: '02 — THE SHIT',
    nav: 'THE SHIT',
  },
  field: {
    index: '03 / IT GROWS',
    title: 'IT GROWS.',
    body: 'No one planted this. The ground was rich and the ground did the rest. From one gift, a whole green field. The harvest keeps its own schedule and answers to no one.',
    label: '03 — IT GROWS',
    nav: 'THE FIELD',
  },
  board: {
    index: '04 / THE HERD',
    title: 'THE HERD.',
    body: 'The herd keeps its own records. Names counted. Notes pinned. Nothing promised. They came to the barn, they saw what the ground can do, and they stayed.',
    label: '04 — THE HERD',
    nav: 'THE HERD',
  },
  gate: {
    index: '05 / THE GATE',
    title: 'THE GATE.',
    body: 'The gate is not locked. It never was. Come stand in the field, or watch from the fence — the field does not mind either way. The field is busy growing.',
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
export const CONTRACT_ADDRESS = '<<TBD>>'

// TODO(launch): community link (Telegram)
export const JOIN_URL = '<<TBD>>'

// TODO(launch): chart link — labeled "$BULLSHIT ↗", never "buy"
export const TOKEN_URL = '<<TBD>>'

export const SOCIALS = [
  { label: 'X / TWITTER', url: 'https://x.com/BULLSHIT_ANSEM' },
  { label: 'CHART', url: '<<TBD>>' },
  { label: 'TELEGRAM', url: '<<TBD>>' },
]
