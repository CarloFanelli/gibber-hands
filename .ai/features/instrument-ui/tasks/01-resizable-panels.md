# Task 01: resizable-panels

## Objective

The camera, instrument and live code panels sit side by side, separated by drag handles that resize them. Their sizes are remembered between visits, a button hides or shows the code panel, and narrow windows stack the panels.

## Context

**Satisfies**: REQ-1, REQ-2, REQ-3, REQ-4

The three panels exist as stubs. Giving them their final layout first means presets, step hints and the code tools land in their final place. Resizing reuses the author's Resizer: its 2024 file is copied in, with a header that links the original commit and lists every fix. The C key for the code panel arrives in task 05.

## Depends on

None

## Expected Behavior

- Three panels side by side: camera, instrument, live code. Drag handles between them resize them, and no panel gets narrower than 160 px.
- Sizes are saved when a resize ends and restored on the next visit. A first visit opens at camera 45%, instrument 25%, code 30%.
- A button hides or shows the live code panel; the other panels share its space. Whether it is hidden is not remembered.
- Below 720 px of window width, the panels stack vertically (camera, instrument, code) without resize handles.
- With all panels shown, audio on and a panel being resized, tracking still meets 25 fps on both reference laptops.
- The copied Resizer file differs from its 2024 commit only by the fixes listed in its header.

## Acceptance Criteria

- [ ] Three panels sit side by side with drag handles that resize them; none gets narrower than 160 px (REQ-1)
- [ ] Sizes are saved when a resize ends and restored on reload; a first visit opens at 45/25/30% (REQ-2)
- [ ] A button hides and shows the live code panel, and the other panels share its space (REQ-3)
- [ ] Below 720 px the panels stack camera, instrument, code, with no resize handles (REQ-4)
- [ ] The copied Resizer file differs from its 2024 commit only by the fixes its header lists (REQ-1)

## Edge Cases

- Panel dragged toward zero width → stops at the 160 px minimum (REQ-1)
- Mouse released outside the window during a resize → the resize ends at the last position (REQ-1)
- Window resized after a panel drag → panels keep their proportions, one of the listed Resizer fixes (REQ-1, REQ-2)
- First visit, nothing saved → camera 45%, instrument 25%, code 30% (REQ-2)
- Saved sizes unreadable or for a different number of panels → ignored; defaults used (REQ-2)
- Browser storage blocked (e.g. private mode) → defaults every visit, no error (REQ-2)
- Code panel hidden, then page reloaded → the code panel is shown again (REQ-3)
- Code panel hidden in the stacked layout → it leaves the stack; the others keep their order (REQ-3, REQ-4)
- Window exactly 720 px wide → side by side (REQ-4)
- Window crosses 720 px (phone rotated, window resized) → the layout switches without a reload; saved desktop sizes are untouched (REQ-4, REQ-2)
- Keyboard only → the resize handles work with the mouse only; keyboard users keep the current sizes (REQ-1 · from code)
