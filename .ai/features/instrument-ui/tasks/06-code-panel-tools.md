# Task 06: code-panel-tools

## Objective

The live code panel gets a "Copy" button, an "Open gibber.cc" link and coloured code, so the snippet is easy to read and to take to the playground.

## Context

**Satisfies**: REQ-18, REQ-19, REQ-20

The snippet already updates live (hand-to-sound). This task makes it usable outside the page: copy it, open the playground beside the instrument, and read it at a glance. The colouring uses no library, and no runtime dependency is added.

## Depends on

- Task 01

## Expected Behavior

- A "Copy" button copies the snippet to the clipboard and shows "Copied" for 2 seconds.
- An "Open gibber.cc" link opens the playground in a new tab while the instrument keeps playing.
- The snippet shows keywords, numbers and comments in distinct colours, without a library.
- A snippet longer than the panel wraps, with no horizontal scroll.

## Acceptance Criteria

- [ ] "Copy" puts the snippet on the clipboard and shows "Copied" for 2 seconds (REQ-18)
- [ ] "Open gibber.cc" opens the playground in a new tab while this tab keeps playing (REQ-19)
- [ ] Keywords, numbers and comments show in distinct colours, with no library added (REQ-20)

## Edge Cases

- Clipboard blocked or unavailable → "Copy failed — text selected"; the snippet is selected for manual copy (REQ-18)
- Copy pressed while the snippet updates → copies the snippet visible at that moment (REQ-18)
- Offline → gibber.cc fails in its own tab; the instrument is unaffected (REQ-19)
- Link clicked while playing → a new tab opens; this tab keeps playing (REQ-19)
- Snippet longer than the panel → wraps, no horizontal scroll (REQ-20)
- Text the colouring doesn't recognize → default colour (REQ-20)
- Link clicked while playing with the camera → this tab is hidden, so the hand counts as gone and the sound fades; audio stays on and plays again on return. With the sliders it keeps playing (REQ-19 · from code)

## Notes from implementation

- **Impacts Task 06**: from task 05, the help sheet (`src/ui/helpSheet.ts`) lists every control. Add "Copy" and "Open gibber.cc" to its "Mouse and touch" list. The shortcuts already leave Space to a focused button or link, so these two need nothing in `src/ui/shortcuts.ts`.
- **Known limitation**: only Chromium was tested, scripted in headless mode. The checks covered:
  - Copy, with "Copied" still there at 1.4 s and gone at 2.2 s;
  - five Copy presses while the sliders moved, each copying the snippet on screen at that press;
  - a missing clipboard, as outside a secure context, and a refused one: both show "Copy failed — text selected" and select the snippet;
  - the selected snippet holding still for a second while the sliders moved, then updating after a click elsewhere;
  - part of the snippet selected with the mouse, also holding still;
  - the link opening the playground in a new tab with no access back to this one, while this tab stayed on "Audio on";
  - no sideways scroll with the code panel at 160 px or at 390 px stacked;
  - C pressed with focus on Copy, which moves focus to "Show code";
  - the snippet shown at boot, before tracking.

  The camera case, where the hidden tab makes the hand count as gone, was not tried with a real hand: it rests on the tracker's existing handling of a hidden tab. Firefox and Safari clipboard behaviour was not tried. /dev, 2026-11-03.
