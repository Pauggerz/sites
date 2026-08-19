# $BULLSHIT

> Draft. Everything here is a starting position — override anything that
> doesn't match what you want. `/loop` measures the build against this file, so
> fix it here rather than arguing with the agent later.

## What it is

A black bull stands in a dark barn. It drops one. The drop is treated with
total reverence — spotlit, framed, monumental. Then the camera goes past the
barn door and shows the pasture, where everything is growing out of it.

The joke is the straight face. Nothing in the site winks. The bull is majestic,
the pile is a monument, the field is a harvest. It's a memecoin site built like
a nature documentary about livestock, and it never breaks character.

`$BULLSHIT` is a parody of `$ANSEM` — The Black Bull. That's the reference
point, and it's why the bull is black and why the tone is mock-serious.

## Voice

Deadpan, agricultural, faintly biblical. Short declaratives. Farm and livestock
vocabulary used with unearned gravity — *the herd, the yield, the feed, the
harvest.* Never explains the joke.

**Never:**
- Price, market cap, returns, gains, "up only," or anything implying money made
- Roadmap, utility, or partnership claims
- Words attributed to Ansem, or anything implying he endorses this. The bull is
  a persona. He is a real person. Parody the bull, never quote the man.
- Toilet humor for its own sake. The restraint is the whole joke — one scatological
  word in the ticker, everything else played completely straight.

## Look

| role | hex | use |
|---|---|---|
| `--void` | `#0b0906` | background, barn dark |
| `--hide` | `#17130e` | the bull, deep shadow |
| `--muck` | `#6b4a22` | the drop, wood, leather |
| `--muck-hi` | `#a0743a` | lit edges of the above |
| `--gold` | `#f0b429` | bare-bulb light, all highlight and focus |
| `--grass` | `#7db02a` | growth, the pasture beat only |
| `--bone` | `#f2e6cf` | body text |

Display font: **Alfa Slab One** — heavy slab, reads as feed-sack signage.
Mono: **IBM Plex Mono** — house standard, matches the other projects.

One bare bulb is the hero light. Everything else falls off into black. Dust in
the beam. The pasture beat is the only place green appears — it should feel like
walking outside.

## Beats

| # | key | camera | says |
|---|---|---|---|
| 01 | `bull` | slow push onto the bull, side-lit, breathing | THE BLACK BULL |
| 02 | `drop` | tilt down to the floor, spotlight snaps on | THE DROP |
| 03 | `field` | past the barn door, green, wide | IT GROWS |
| 04 | `board` | the muck board — screens, pinned notes, the herd | THE HERD |
| 05 | `gate` | pull back to the full barn, launch hub | THE GATE |

Plus `start` (intro sweep origin) and `overview`, matching the house pattern.

## Interaction

Same skeleton as the reference projects: scroll on desktop, swipe on touch,
arrow keys and digits always. Accumulator with cooldown so momentum can't skip
beats.

Scene-level interactive objects, the equivalent of the GME cartridge row:

- **Four feed pails on a rail** under the board — one per beat, click to jump.
  Lit pail = current beat.
- **A CA tag nailed to the post** — a numbered cattle ear tag holding the
  contract address. Tap to copy, tag flips to COPIED.
- **The bulb** — click to pull the cord. Light swings, shadows move. Does nothing
  else. It's there because people will click it.

## Hard facts

Fill these in before launch. Leave the placeholder text visible until then —
never invent a value.

- Contract address: `<<TBD>>`
- X / Twitter: `https://x.com/BULLSHIT_ANSEM`
- Chart: `<<TBD>>`
- Telegram / community: `<<TBD>>`

## Assets

Placeholders are in `public/` — see `ASSETS.md` for the full list, sizes, and
what each one needs to be. Every placeholder is a labeled SVG at the correct
dimensions, so the scene builds and runs before any art exists.

The bull and the pile are **billboard sprites on camera-facing planes**, not 3D
models. Hand-drawn art on a plane, lit by the scene. This keeps the art style
yours and avoids sourcing livestock models that wouldn't match anyway.

## Done means

- Every beat reachable by scroll, swipe, arrows, and digit keys
- Holds frame rate on a mid-range phone in both orientations
- Enter gate unlocks audio; nothing pops in after it opens
- CA copies with one tap and confirms visually
- Twitter card renders correctly when the link is pasted
- No placeholder art and no `<<TBD>>` left in the build
- `npm run lint` and `npm run build` both clean
