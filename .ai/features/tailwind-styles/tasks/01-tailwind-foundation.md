# Task 01: tailwind-foundation

## Objective

The site builds with Tailwind, the studio look's colours, fonts, radii and shadows are named theme values, and a look check can compare any build against today's page. The page looks exactly as before.

## Context

**Satisfies**: REQ-1, REQ-2, REQ-4, REQ-5, REQ-11, REQ-12

Every later task moves styles and must prove the page did not change. This task sets up the build, the theme and the look check, and records today's page as the baseline before any style moves.

## Depends on

None

## Expected Behavior

- The look check records, for each screen of REQ-2 at 1280, 1000, 390 and 360 px, every visible element's position, size, colours and font, plus a screenshot.
- The look check compares a build against the baseline and lists every element that moved by more than 1 px or changed colour or font.
- The look check also runs the contrast audit in all 8 states and lists any text under 4.5:1.
- The baseline is recorded from today's page before any style changes.
- After this task the comparison against the baseline reports no difference.
- `npm ci`, the tests and `npm run build` succeed as the deploy workflow runs them, with the workflow file unchanged.

## Acceptance Criteria

- [ ] The baseline exists for every screen and width of REQ-2, recorded before any style change (REQ-1, REQ-2)
- [ ] Comparing this task's build against the baseline reports no difference (REQ-1)
- [ ] The contrast audit reports no text under 4.5:1 in all 8 states (REQ-4)
- [ ] Each colour, font, radius and shadow of the studio look is a named theme value (REQ-5)
- [ ] The deploy workflow's steps succeed locally with the workflow file unchanged (REQ-11)
- [ ] The production stylesheet is at most 10 KB compressed (REQ-12)

## Edge Cases

- Focus moved with the keyboard → the same accent focus ring on every control as today (REQ-3, REQ-4)
- A class used by code but missing from the stylesheet → the look check shows it as a difference (REQ-12)
- CI can't install packages → the build fails and nothing deploys; the published site stays as it was (REQ-11)
- Built stylesheet over 10 KB compressed → a failure of this task, measured on the production build (REQ-12)

## Notes from implementation

- **Known limitation**: the base layer sets back the browser's own look for buttons, inputs, selects and dialogs (font, colours, margins, padding, border) and bold `h2`/`h3`, because the page relied on it: Start audio, Try again and the sheet × use the browser's button font today, and dialogs are centred by the browser's margins. Utilities that replace a rule must say what the rule said (e.g. `font-[inherit]`), since the browser's defaults, not Tailwind's, are underneath. /dev, 2026-11-11.
- **Known limitation**: the look check records with reduced motion on, so the step hint icons hold still; the animations themselves are checked by eye. /dev, 2026-11-11.
