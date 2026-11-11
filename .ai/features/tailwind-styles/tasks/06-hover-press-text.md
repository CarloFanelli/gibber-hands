# Task 06: hover-press-text

## Objective

Every button reacts to hover and shows when it is pressed, text uses five sizes, and the hand-written stylesheet holds only what utilities can't express.

## Context

**Satisfies**: REQ-4, REQ-7, REQ-8, REQ-9, REQ-10, REQ-12

The three fixes change the look on purpose, so they come after every task that had to match the baseline exactly; this task then records the new baseline differences as intended.

## Depends on

- Task 05

## Expected Behavior

- Outlined buttons brighten their border on hover; filled buttons lighten.
- Every enabled button darkens slightly while pressed; disabled buttons show neither change.
- Text uses only 12, 14, 16, 18 and 20 px: 13 px becomes 14 px, the phone Start button's 17 px becomes 16 px.
- The look check reports only the differences these changes explain.
- The hand-written stylesheet is at most 80 lines, holding only animations, the camera mirror and the copied libraries' classes.

## Acceptance Criteria

- [ ] Every button and link shown as a button changes on hover (REQ-8)
- [ ] Every enabled button darkens while pressed; disabled ones don't change (REQ-9)
- [ ] Only 12, 14, 16, 18 and 20 px text sizes remain (REQ-10)
- [ ] The contrast audit reports no text under 4.5:1 in all 8 states (REQ-4)
- [ ] The hand-written stylesheet is at most 80 lines (REQ-7)
- [ ] The production stylesheet is at most 10 KB compressed (REQ-12)

## Edge Cases

- Muted text moved from 13 to 14 px → preset cards keep the scale fully visible; only the character may cut off with "…" (REQ-4, REQ-10)
- Phone Start button moved from 17 to 16 px → the top bar still fits on one line at 360 px (REQ-3, REQ-10)
- Icons drawn as text (×, ♫, ?, the status icons) → keep their sizes (REQ-10)
- Hover on a touch screen → no hover style sticks after a tap (REQ-8)
- Pressing a disabled button → no pressed or hover change; half opacity as today (REQ-9)
- Accent-coloured hover on a filled button → text keeps at least 4.5:1 contrast (REQ-4, REQ-8)
- Built stylesheet over 10 KB compressed → a failure of this task (REQ-12)
