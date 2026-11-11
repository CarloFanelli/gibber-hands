# Task 05: side-panel-sheets

## Objective

The side panel, its tabs, the live code, the gesture guide, the resize bar, the collapsed strip and the phone bottom sheets are styled with Tailwind utilities and behave exactly as today.

## Context

**Satisfies**: REQ-1, REQ-3, REQ-6

This is the part shaped by Resizer's widths and by the switch to bottom sheets below 720 px, which overrides the saved widths and places; it comes once the sounds panel is moved, since the sheets restyle both panels.

## Depends on

- Task 03
- Task 04

## Expected Behavior

- The side panel, tabs, Copy, Open gibber, the code colours, the gesture guide, the resize bar and the collapsed strip take their styles from utilities.
- The bottom bar and both bottom sheets take their styles from utilities, and replace the panels below 720 px as today.
- Resizing, collapsing and restoring the side panel works and looks as today.
- The look check reports no difference for any screen.

## Acceptance Criteria

- [ ] The side panel and bottom sheets have no styles left in the hand-written stylesheet, except Resizer's handle (REQ-6)
- [ ] The look check reports no difference at 1280, 1000, 390 and 360 px, both sheets open included (REQ-1)
- [ ] At 719 px the bottom bar and sheets show; at 720 px the side panel and floating sounds panel (REQ-3)
- [ ] A saved side panel width and the collapsed state are restored as today (REQ-3)

## Edge Cases

- Window exactly 719 or 720 px wide → 719 shows the bottom bar and sheets, 720 the side panel and floating sounds panel (REQ-1, REQ-3)
- Saved panel width from a previous visit → restored; no class overrides the width Resizer sets (REQ-3)
- State classes switched by code (collapsed side panel, open sheet) → each still changes the look exactly as today (REQ-3, REQ-6)
- Resizer's handle class → still styled as today; the copied files aren't changed (REQ-7)
- Code colours built from the token kind in code → written out in full, so the build finds every class (REQ-6, REQ-12)

## Notes from implementation

- **Impacts Task 02–05**: under the utilities sit the browser's own defaults for buttons, inputs, selects and dialogs (Task 01 base layer), not Tailwind's resets: a moved rule keeps every property it set, `font: inherit` included. Check each move with `npm run look -- capture .look/now` then `compare .look/baseline .look/now`. /dev, 2026-11-11.
