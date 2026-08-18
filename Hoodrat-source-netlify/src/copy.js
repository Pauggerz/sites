// $HOODRAT — Matt Furie's bat-rat from The Night Riders, the gold-plated
// menace of the Robinhood chain. Every word sells vibe and mentality;
// memecoin playfulness welcome, trading mechanics never mentioned.
export const BEATS = {
  rat: {
    index: '01 / THE RAT',
    title: 'THE BLOCK HAS A NEW RAT.',
    body: 'Nobody saw it land. Big ears, gold shine, straight out of the Night Riders. The whole hood started moving different. Pay respects at the shrine.',
    label: '01 — THE RAT',
    nav: 'THE RAT',
  },
  wall: {
    index: '02 / THE SCREEN',
    title: 'THE WHOLE BLOCK IS WATCHING.',
    body: 'The big screen stays loud while the glyphs keep running behind it. Alley energy, corner-store glow, rat posted up like it owns every camera.',
    label: '02 — THE SCREEN',
    nav: 'THE SCREEN',
  },
  lounge: {
    index: '03 / GUTTER BORN',
    title: 'GUTTER BORN. BUILT DIFFERENT.',
    body: "You can't shake what was raised in the drain. In here nobody panics — we burrow, we regroup, we resurface. That's rat behavior. That's hood behavior.",
    label: '03 — GUTTER BORN',
    nav: 'GUTTER BORN',
  },
  desk: {
    index: '04 / THE SCURRY',
    title: 'TRAPS GET SET. RATS EAT ANYWAY.',
    body: 'Patience is not waiting — it is knowing every route in and out. Same block, same hunger, every single night. Then one clean grab.',
    label: '04 — THE SCURRY',
    nav: 'THE SCURRY',
  },
  door: {
    index: '05 / THE DOOR',
    title: 'THE GRATE IS OPEN.',
    body: 'The sewer runs under every street in this city. Hunger brought the rat here — loyalty kept it posted. If you know the knock, slip through and join the mischief.',
    label: '05 — THE DOOR',
    nav: 'THE DOOR',
    cta: true,
  },
}

// nav dock order — spatial narrative through the burrow
export const NAV_ORDER = ['rat', 'wall', 'lounge', 'desk', 'door']

export const GATE_LINES = ['Every hood has a rat']

// TODO(launch): VERIFY — this is the HOODRAT CA on the Robinhood chain as
// listed by OpenSea/CoinCodex. Replace if it's not yours before going live.
export const CONTRACT_ADDRESS = '0x8e62F281f282686fCa6dCB39288069a93fC23F1c'

// TODO(launch): replace with the mischief's real invite link (Discord/Telegram/application form)
export const JOIN_URL = 'https://x.com/hoodrat_coin'

// TODO(launch): swap/DEX link for the token — labeled "$HOODRAT ↗", never "buy"
export const TOKEN_URL = 'https://dexscreener.com/robinhood/0x8e62F281f282686fCa6dCB39288069a93fC23F1c'

// TODO(launch): real social links
export const SOCIALS = [
  { label: 'X / TWITTER', url: 'https://x.com/hoodrat_coin' },
  { label: 'CHART', url: 'https://dexscreener.com/robinhood/0x8e62F281f282686fCa6dCB39288069a93fC23F1c' },
]
