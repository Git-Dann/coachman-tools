# Coachman Order Flow

An interactive presentation of the Coachman order process, from the discovery
session on site on 3 September 2026. Used live in a room, and sent as a link
afterwards, so it has to work on a phone.

## The three views

Same dataset, three lenses. Each is separately linkable so the right person
gets the right link.

| Path | For | Covers |
| --- | --- | --- |
| `/operations` | The people doing the work | The process end to end, follow one caravan, all twenty handoff points, what changes |
| `/leadership` | The board | The risks in order, the breaking point, the hours model, the four faults, how it lands |
| `/technical` | Our side and their IT | The three decisions, the standard twelve stages, the entities, the stack, headroom, what is still to settle |

`/` serves the Operations view.

## Content

Every string and number on screen lives in `content/`, typed and separate from
the components. Nothing is hardcoded in JSX.

| File | Holds |
| --- | --- |
| `steps.ts` | The sixteen steps, with the five that disappear marked `keep: 0` |
| `stages.ts` | The standard twelve stages |
| `handoffs.ts` | The twenty points the same work gets done twice |
| `risks.ts` | The risks, in order |
| `faults.ts` | Four things that are broken, not missing |
| `entities.ts` | What the data hangs off |
| `stack.ts` | What it runs on, and the headroom figures |
| `van.ts` | The example unit's twelve stages |
| `model.ts` | The breaking point and hours model: constants, zones, verdicts, derivations |
| `copy.ts` | Section headings, standfirsts, quotes and lists |
| `views.ts` | The three views, paths and metadata |

This is a Coachman-specific build, but keeping the content separate costs
nothing and means the next client is a data file rather than a rebuild.

## Rules the content follows

- **Nothing is invented.** Every figure traces back to something said on the
  day. Where something is an estimate it says so on screen.
- **No fabricated breaking point.** We do not know where the current system
  actually fails. The gauge zones are labelled as what they told us, not as
  measurement.
- **British English.** No em dashes.

## Design

Committed dark, no light theme. The palette is defined as CSS variables in
`@theme` in `app/globals.css`.

| Token | Use |
| --- | --- |
| `--color-ink` `#0C1116` | Page |
| `--color-surface` `#141B22` | Raised |
| `--color-surface-2` `#1C2530`, `--color-surface-3` `#233040` | Controls |
| `--color-line` `#263039`, `--color-line-2` `#35424E` | Hairlines |
| `--color-text` `#E9EFF3`, `--color-text-2` `#9DAFBA`, `--color-text-3` `#6C7D89` | Text |
| `--color-brass` `#D9A24B` | Accent, section numbers, active values |
| `--color-steel` `#74A8C4` | The current system |
| `--color-flag` `#E4593C` | Problems, handoffs, faults |
| `--color-moss` `#6FAE7F` | Improvements, savings |

Chivo for headings and UI, IBM Plex Mono for numbers, codes, labels and system
vocabulary, Newsreader italic for the quotes from the call and nothing else.
Tabular numerals wherever digits change or line up.

Hairline rules over cards wherever possible. Only the things people act on get
a raised surface and a coloured left edge.

## Running it

```
npm install
npm run dev      # http://localhost:3000
npm run build
```

Next.js 15 App Router, TypeScript, Tailwind v4. No database, no auth, no API
routes, no analytics. Every page prerenders as static content.

## Source material

- `reference/coachman-order-flow.html` — the single-file version this was
  ported from. Content source of truth.
- Coachman Process Record (v1, from site visit) — the discovery notes.
- Manufacturing Platform: Architecture Foundation — the three locked decisions,
  the twelve standard stages, entities, stack, headroom.
