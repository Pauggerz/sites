# Assets

Every file below exists in `public/` as a labeled placeholder at the right
dimensions. The site builds and runs with all of them in place — swap them one
at a time and nothing breaks in between.

Replace the `.svg` placeholder with a `.png` of the same base name when your art
is ready, then update the path in the scene file. Keep the dimensions.

## Priority order

Do them in this order — each one makes the scene noticeably more finished than
the last.

1. `art/bull` — the whole site is built around it
2. `brand/bullshit-mark` — needed for favicon and share card
3. `art/pile`
4. `brand/wordmark`
5. everything else

---

## brand/

**`bullshit-mark`** · 512×512 · transparent
The logo. Square, and it has to survive being shrunk to 32px for the favicon —
so no fine detail, no thin strokes. This also gets masked to a single color in
places, so it should read as a silhouette.

**`wordmark`** · 1024×256 · transparent
Horizontal `$BULLSHIT` lockup. Used on the loading gate and the share card.

## art/

**`bull`** · 1024×1024 · transparent
The hero. Full body, three-quarter view facing left, standing. Black hide with
gold rim light coming from the upper right — match the bare-bulb direction in
the scene or it'll look pasted on. Leave headroom above the horns; the camera
pushes in close on beat 01.

**`bull-eyes`** · 512×256 · transparent
Just the eyes, glowing, everything else transparent. This layers on top of
`bull` as an emissive pass so the eyes stay lit when the rest falls into
shadow. Align it to the same 1024×1024 frame as the bull so it registers.

**`pile`** · 1024×768 · transparent
The drop. Same lighting direction as the bull. Should read as *monument* — give
it weight and a clear silhouette. Optional: a second file with steam, if you
want it animated later.

**`sprout`** · 512×768 · transparent
Green pushing up out of muck. Used repeated across the pasture beat at varying
scales, so keep it generic enough to tile without an obvious repeat.

**`poster-herd`** · 768×1024
Wall poster, community theme. Reference: the `MOON` and `GAME NIGHT` posters in
the GME room. Aged paper, slight tilt when placed.

**`poster-feed`** · 768×1024
Wall poster, feed-sack or farm-supply signage parody. This is where you can be
funniest — it's set dressing, so it can carry a joke the main copy can't.

**`board-idle`** · 1280×720
What the board shows before anything plays. Static, noise, or a held frame. If
you later drop in a video loop, this is the poster frame.

**`pail`** · 512×512 · transparent
A feed pail, front-facing. You need **four recolors** — one per beat, using
`--muck`, `--gold`, `--grass`, and `--bone`. Name them `pail-01` through
`pail-04`.

**`tag`** · 512×256 · transparent
A numbered cattle ear tag. Used for the CA tag on the post and as the beat
marker in the HUD. Needs a blank area big enough for a truncated wallet address
in mono type.

---

## Not art, but needed

**`hoodrat-screen.mp4` equivalent** — the board loop, if you want one. In the
reference project this single video element carries both picture and sound, so
if there's a song it goes in this file's audio track, not a separate one.

**`favicon`** — generated from `bullshit-mark` at 32×32. Do this last, once the
mark is final.
