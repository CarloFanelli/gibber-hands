# Task 03: sounds-panel

## Objective

The sounds panel, its preset cards, Now playing and the drum controls are styled with Tailwind utilities, and look, drag and shrink exactly as today.

## Context

**Satisfies**: REQ-1, REQ-3, REQ-6

The sounds panel floats over the stage and depends on classes drag-kit adds while a preset card is dragged, so it moves on its own, after the shared button patterns exist.

## Depends on

- Task 02

## Expected Behavior

- The sounds panel, its title bar, the shrunk icon, the preset cards, Now playing and the drum controls take their styles from utilities.
- Dragging a preset card and dropping it on Now playing shows the same highlights as today.
- Shrinking the panel to an icon and opening it again looks as today, and its saved position is restored.
- The look check reports no difference for any screen.

## Acceptance Criteria

- [ ] The sounds panel and its contents have no styles left in the hand-written stylesheet, except drag-kit's classes (REQ-6)
- [ ] The look check reports no difference at 1280, 1000, 390 and 360 px (REQ-1)
- [ ] A dragged preset card and the drop target look as today (REQ-3)
- [ ] The shrunk sounds panel looks as today and keeps its saved position (REQ-3)

## Edge Cases

- Saved sounds panel position from a previous visit → restored as today; no class overrides the position the panel sets (REQ-3)
- State classes switched by code (shrunk, drop target, dragged card) → each still changes the look exactly as today (REQ-3, REQ-6)
- drag-kit's classes on the dragged card → still styled as today; the copied files aren't changed (REQ-7)

## Notes from implementation

- **Impacts Task 02–05**: under the utilities sit the browser's own defaults for buttons, inputs, selects and dialogs (Task 01 base layer), not Tailwind's resets: a moved rule keeps every property it set, `font: inherit` included. Check each move with `npm run look -- capture .look/now` then `compare .look/baseline .look/now`. /dev, 2026-11-11.
