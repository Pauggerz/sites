---
description: Capture the brief for a project before any building starts
argument-hint: [project or token name, plus whatever you already know]
---

Set up the brief for: **$ARGUMENTS**

The brief is the base information everything else gets built against. Write it
once, well, and the rest of the work stops needing me to re-explain things.

## First, look around

Read `CLAUDE.md` at the repo root, then open the closest existing project in
this repo and read its `copy.js` header and `index.html` meta. Match that shape.

## Then interview me

Ask about the gaps you can't infer — but only the ones that actually change
what gets built. Batch the questions; don't drip them one at a time. The things
worth knowing:

- What the thing *is*, in one sentence, and where its story comes from
- The voice, and specifically what the copy is **not** allowed to say
- Palette and the two typefaces (display + mono)
- The beats: named sections the user moves through, in order
- What's real and must be exact — contract address, socials, links
- Any asset I already have, and what still needs sourcing

If I've given you a link or a doc, read it first and only ask about what's
still missing.

## Then write it

Save to `<project>/BRIEF.md`:

```markdown
# <name>

## What it is
One paragraph. The premise and the feeling.

## Voice
How the copy sounds. Then a "never" list — the words, claims, and topics
that stay out.

## Look
Palette as hex with role names. Display font, mono font. Reference points.

## Beats
| # | key | what the camera/user is looking at | what it says |

## Hard facts
Anything that must be reproduced character-exact.

## Assets
Have / still need.

## Done means
The bar for calling this finished.
```

Show me the brief and wait for my go-ahead before writing any code. If
something in it is thin, say which part and why it'll cause problems later.