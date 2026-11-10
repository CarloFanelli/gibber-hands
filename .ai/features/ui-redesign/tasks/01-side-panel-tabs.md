# Task 01: side-panel-tabs

## Objective

The live code and the gesture guide move into one side panel on the right, shown as two tabs, which the player can collapse, expand and resize, and which is remembered between visits.

## Context

**Satisfies**: REQ-7, REQ-8, REQ-9, REQ-10, REQ-11, REQ-12

First, because it replaces the code column, the least-coupled part of the old layout: the camera and instrument columns keep working beside it until Tasks 02 and 03 replace them. It also brings the superseded requirements of the earlier specs up to date, since the project rule is spec first, then code.

## Depends on

None

## Expected Behavior

- The superseded requirements in the instrument-ui, note-range, two-hand-play and drum-loop specs are marked as replaced by ui-redesign, and each of those specs bumps its version.
- The right-hand column becomes the side panel, with two tabs, Code and Gestures. Only the selected tab shows, and it fills the panel's full height.
- The Code tab shows the live code with Copy and Open gibber.cc, behaving as today.
- The Gestures tab shows the gesture guide, naming each hand by role and side and following the left-handed swap.
- The divider between code and guide is gone.
- A button on the side panel and the C key collapse it to a narrow strip with an expand button, and expand it again. The camera takes the freed space.
- Dragging the side panel's left edge resizes it, between 280 px and half the window's width.
- A first visit opens it on the Code tab at 360 px. Later visits restore its width, open state and tab.

## Acceptance Criteria

- [ ] Two tabs, Code and Gestures; the selected one alone fills the side panel's height (REQ-7)
- [ ] Copy, Open gibber.cc and the live code behave as before the redesign (REQ-8)
- [ ] The Gestures tab relabels the hands at once when left-handed is switched (REQ-9)
- [ ] The side panel's button and the C key collapse and expand it, and the camera widens and narrows with it (REQ-10)
- [ ] Dragging the left edge stops at 280 px and at half the window's width (REQ-11)
- [ ] First visit: open on Code at 360 px; a reload restores width, open state and tab (REQ-12)

## Edge Cases

- Side panel collapsed while the live code updates → updates continue unseen, and expanding shows the current code (REQ-8, REQ-10)
- Copy denied by the browser → Copy shows "Copy failed" for 2 s instead of "Copied" (REQ-8)
- Left-handed switched while the Gestures tab is shown → the guide relabels the hands at once (REQ-9)
- C pressed while typing in a slider field → the key goes to the field, and the panel doesn't toggle (REQ-10, REQ-32)
- Drag past 280 px or half the window → the width stops at the limit (REQ-11)
- Touch-only screen ≥ 720 px → the side panel collapses and expands but doesn't resize (REQ-11)
- Saved width now wider than half the window (smaller screen) → it is clamped to half the window, and the saved value is kept for wider windows (REQ-12)
- Saved layout unreadable or missing (cleared or private mode) → first-visit layout, with no error shown (REQ-12)
- Restored on a window of another size → the side panel keeps its share of the window, not its pixel width (REQ-12 · from code)
