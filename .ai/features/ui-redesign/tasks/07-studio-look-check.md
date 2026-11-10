# Task 07: studio-look-check

## Objective

Every bar, panel, sheet and dialog shares the studio look with ≥ 4.5:1 text contrast, and the redesign is checked against its success bar: speed, keyboard access and first-time visitors.

## Context

**Satisfies**: REQ-30

Task 02 set the look's colours and fonts, and each task styled its own part. This pass makes them consistent and measures what only the whole page can show: contrast everywhere, fps with all panels open, 200 ms transitions, keyboard-only use, and the 3-visitor test.

## Depends on

- Task 04
- Task 06

## Expected Behavior

- Bars, panels, sheets and dialogs use solid dark surfaces, one accent colour and a monospace font for numbers and code.
- All text, hand tags and lane labels included, has ≥ 4.5:1 contrast against what is behind it.
- Opening or closing a panel, sheet or dialog finishes within 200 ms with no audible glitch.
- Every control can be reached and used with the keyboard alone, and each dialog announces its title to screen readers.
- The results of the fps check and the visitor test are written in docs/PROCESS.md.

## Acceptance Criteria

- [ ] Every surface is solid dark with one accent and monospace numbers and code (REQ-30)
- [ ] An automated contrast check finds no text below 4.5:1, and hand tags hold it over a white wall (REQ-30)
- [ ] Tracking holds ≥ 25 fps on both reference laptops with the side panel and sounds panel open (REQ-30)
- [ ] 3 of 3 first-time visitors make a sound within 20 s and switch preset within 60 s, without help (REQ-30)

## Edge Cases

- Contrast over the camera (hand tags, lane labels) → they have a solid dark background, so contrast holds over any video (REQ-30)
