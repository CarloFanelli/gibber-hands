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
