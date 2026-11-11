---
feature: tailwind-styles
version: 1.0
status: approved
base: 0cfbfcb9bedf978d6b6c34e0c25e7dc24a99d08f
completed: true
---

# Tailwind Styles

## Overview

The page keeps the studio look the UI redesign gave it, rebuilt with Tailwind. Today one hand-written stylesheet of
about 240 lines styles every element by a descriptive class name. After this feature, each element carries its
styles as Tailwind utility classes in the code that builds it. The look's colours, fonts and sizes are defined
once as theme values, and repeated patterns such as the outlined button are defined once and reused. Three small
fixes ride along: every button reacts to hover, every button shows when it is pressed, and text uses five sizes
instead of nine. The site still builds and deploys to GitHub Pages as it does today.

## Project Context

- The look is the studio look: solid dark surfaces, one accent, monospace for names, numbers and code.
- No framework: elements are built in TypeScript, often from HTML template strings.
- Resizer and drag-kit are copied into the repo and changed only with minimal, listed fixes; their own classes stay as they are.
- Some state classes are switched by code (e.g. the prominent Start button, the collapsed side panel, the shrunk sounds panel).
- The top bar and the camera view adapt to their own width (container queries); the page switches to bottom sheets below 720 px.
- The site deploys from main through the existing GitHub Pages workflow, under the /gibber-hands/ path.
- CLAUDE.md now allows prebuilt native binaries at build time (Rolldown, Tailwind), not modules compiled at install.

## Functional Requirements

### Same look

- REQ-1: At 1280, 1000, 390 and 360 px wide, each screen matches today's within 1 px and in colour, except changes from REQ-8 to REQ-10.
- REQ-2: The screens compared are: first visit with the welcome dialog, camera live, sliders without a camera, help dialog, side panel collapsed, sounds panel shrunk, each bottom sheet open.
- REQ-3: Every behaviour of the layout stays: the top bar drops words as it narrows, bottom sheets below 720 px, hand tags, reduced motion.
- REQ-4: Every text keeps at least 4.5:1 contrast with its background in all 8 states the contrast audit checks today.

### Written with Tailwind

- REQ-5: Each colour, font, radius and shadow of the studio look is defined once as a named theme value; no element repeats a raw colour.
- REQ-6: Elements take their styles from Tailwind utility classes in the code that builds them; a pattern used 3 or more times is defined once.
- REQ-7: The hand-written stylesheet left holds only what utilities can't express (animations, the camera mirror, the copied libraries' classes), at most 80 lines.

### Small fixes

- REQ-8: Every button, and every link shown as a button, changes on hover: outlined ones brighten their border, filled ones lighten.
- REQ-9: Every enabled button darkens slightly while it is pressed; disabled buttons show no hover or pressed change.
- REQ-10: Text uses only 12, 14, 16, 18 and 20 px; 13 px text becomes 14 px and 17 px text becomes 16 px.

### Build and deploy

- REQ-11: The existing GitHub Pages workflow builds and deploys the site with no step added or changed.
- REQ-12: The published stylesheet holds only classes the code uses and is at most 10 KB compressed.

## Data & Dependencies

### External capabilities relied on

- Tailwind CSS v4 with its Vite plugin — generates the stylesheet at build time from the classes the code uses.

## Non-Functional Requirements

- **Performance** — The page still reaches ≥ 25 fps on both reference laptops with both panels open; hover and pressed changes add no layout work while playing.
- **Validation** — Typecheck, the full test suite and the build stay green; the contrast audit reports no text under 4.5:1.

## Edge Cases & Error Handling

| Edge Case | Expected Behavior | Relates to |
|-----------|-------------------|------------|
| Window exactly 719 or 720 px wide | 719 shows the bottom bar and sheets, 720 the side panel and the floating sounds panel, as today | REQ-1, REQ-3 |
| Top bar exactly at 479/480, 719/720, 899/900, 1099/1100 px | Words drop at the same widths as today; nothing wraps to a second line | REQ-3 |
| Camera view at 559/560 and 319/320 px | Hand tag and step hint words hide below the same widths as today | REQ-3 |
| No camera: sliders fill the stage | Sliders, status cards and Try again look as today | REQ-1, REQ-2 |
| Saved panel width or position from a previous visit | Restored as today; Tailwind classes never override the width Resizer or the sounds panel sets | REQ-3 |
| Reduced motion turned on in the system | Step hint icons don't animate | REQ-3 |
| Prominent Start button before the first sound | Keeps today's size and ring: 38 px tall on desktop, 44 px on phones | REQ-1 |
| Class names built from variables in code (e.g. `'drum-' + name`) | Not allowed: every class is written out in full, so the build finds it and no style goes missing | REQ-6, REQ-12 |
| State classes switched by code (prominent, collapsed, shrunk, drop target) | Each still changes the look exactly as today | REQ-3, REQ-6 |
| Copied library classes (Resizer's handle, drag-kit's dragged card) | Still styled as today; the copied files themselves aren't changed | REQ-7 |
| Muted secondary text moved from 13 to 14 px | Preset cards keep the scale fully visible; only the character may cut off with "…", as today | REQ-4, REQ-10 |
| Phone Start button moved from 17 to 16 px | The whole top bar still fits on one line at 360 px | REQ-3, REQ-10 |
| Icons drawn as text (×, ♫, ?, the status icons) | Keep their sizes: they aren't text sizes | REQ-10 |
| Hover on a touch screen | No hover style sticks after a tap | REQ-8 |
| Pressing a disabled button (e.g. Try again while the camera retries, − at 1 drum layer) | No pressed or hover change; looks as today at half opacity | REQ-9 |
| Focus moved with the keyboard | The same accent focus ring on every control as today | REQ-3, REQ-4 |
| Accent-coloured hover on a filled button | Text keeps at least 4.5:1 contrast on the lighter fill | REQ-4, REQ-8 |
| A future class used by code but missing from the stylesheet | The screenshot comparison shows it; no runtime check is added | REQ-12 |
| CI can't install packages (npm registry down) | The build fails and nothing deploys; the published site stays as it was | REQ-11 |
| Built stylesheet over 10 KB compressed | Counts as a failure of this feature, measured on the production build | REQ-12 |
| N/A — concurrent: styling has no shared state between visitors or tabs | — | REQ-1–REQ-12 |
| N/A — permission: a camera blocked by the browser is covered by the sliders screen | — | REQ-2 |

## Out of Scope

- **A new look or a light theme** — the user asked for the same look; a light theme was already left out of the UI redesign.
- **The sounds panel covering the sliders' left edge at 1280×800 without a camera** — a placement bug, not a styling one; not chosen for this rebuild.
- **Restyling Resizer and drag-kit inside their copied files** — CLAUDE.md allows only minimal listed fixes there.
- **A component framework or a Tailwind UI kit** — the project has no framework; Tailwind alone covers the need.

## Open Questions

- Do the three fixes still feel right with real hands, at ≥ 25 fps, on both reference laptops? (Owner: Carlo)
