# Task 02: top-bar-dialogs

## Objective

The top bar, its status line and buttons, the welcome dialog and the help dialog are styled with Tailwind utilities and look and adapt exactly as today.

## Context

**Satisfies**: REQ-1, REQ-3, REQ-6

The top bar is on every screen and carries the most width-dependent rules (words that drop as it narrows), so it goes first. The two dialogs share its button patterns.

## Depends on

- Task 01

## Expected Behavior

- The top bar, status line, Start audio, Try again, Left-handed and Help take their styles from utilities in the code that builds them.
- The welcome and help dialogs, their headings, key list and buttons take their styles from utilities.
- The outlined button and the filled button are each defined once and reused.
- The look check reports no difference for any screen.

## Acceptance Criteria

- [ ] The top bar and both dialogs have no styles left in the hand-written stylesheet (REQ-6)
- [ ] The outlined and filled button patterns are each defined once (REQ-6)
- [ ] The look check reports no difference at 1280, 1000, 390 and 360 px (REQ-1)
- [ ] The top bar drops words at the same widths as today and never wraps (REQ-3)

## Edge Cases

- Top bar exactly at 479/480, 719/720, 899/900, 1099/1100 px → words drop at the same widths as today; nothing wraps (REQ-3)
- Prominent Start button before the first sound → keeps today's size and ring: 38 px tall on desktop, 44 px on phones (REQ-1)
- State classes switched by code (the prominent Start button) → still change the look exactly as today (REQ-3, REQ-6)
- Class names built from variables → not allowed: every class is written out in full (REQ-6, REQ-12)

## Notes from implementation

- **Impacts Task 02–05**: under the utilities sit the browser's own defaults for buttons, inputs, selects and dialogs (Task 01 base layer), not Tailwind's resets: a moved rule keeps every property it set, `font: inherit` included. Check each move with `npm run look -- capture .look/now` then `compare .look/baseline .look/now`. /dev, 2026-11-11.
