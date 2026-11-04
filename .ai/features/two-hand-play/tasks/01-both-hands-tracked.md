# Task 01: both-hands-tracked

## Objective

The camera view follows and draws up to two hands. The player's right hand is the lead hand and the left is the second hand, and a swap control in the instrument panel reverses them and is remembered. A single hand still plays as today.

## Context

**Satisfies**: REQ-1, REQ-2, REQ-3, REQ-4

Every later task needs to know which hand is which, so roles come first. One note still sounds after this task: with both hands in view it is the lead hand's. Task 02 gives the second hand its own note.

## Depends on

None

## Expected Behavior

- Up to two hands are tracked and drawn in the camera view at once, each with its landmarks; a third hand is ignored.
- The player's right hand is the lead hand and the left hand is the second hand.
- A control in the instrument panel swaps the two roles; the choice is remembered between visits.
- A single hand in view, right or left, plays notes as in the hand-to-sound spec.
- While both hands are in view, the lead hand plays and the second hand is silent until Task 02.
- With two hands moving and audio on, tracking runs at ≥ 25 fps on both reference laptops (checked by hand).

## Acceptance Criteria

- [ ] Two hands in view are both drawn in the camera view; a third hand is ignored (REQ-1)
- [ ] The player's right hand is the lead hand and the left hand is the second hand (REQ-2)
- [ ] The swap control reverses the roles, and the choice survives a reload (REQ-3)
- [ ] A single hand, right or left, plays notes exactly as before this feature (REQ-4)
- [ ] With two hands moving and audio on, tracking runs at ≥ 25 fps on both reference laptops (REQ-1)

## Edge Cases

- A third hand in view (e.g. a second person) → ignored until one of the two tracked hands leaves (REQ-1)
- Two hands both read as right (two people, or a misreading) → the one further right in the camera view counts as the right hand (REQ-1, REQ-2)
- Network → N/A: tracking runs on the device; the hand model loads as in the hand-tracking spec (REQ-1)
- Hands cross → each keeps its role while both stay tracked (REQ-2)
- A hand's left/right reading flickers → a tracked hand keeps the role it had when it appeared until it leaves the view (REQ-2)
- No hand in view → silence, as today (REQ-2, REQ-14)
- Roles swapped while playing → sounding notes continue (REQ-3, REQ-9)
- Browser storage blocked, or the saved choice unreadable → the right hand leads every visit, no error (REQ-3)
- Two hands in view → each hand's gesture label shows on its own side: the left hand's at the top left, the right hand's at the top right under the frame rate (REQ-1 · from code)
- No camera (sliders), roles swapped → the sliders still play as the lead hand (REQ-3 · from code)

## Notes from implementation

- **Known limitation**: the frame rate with two hands and audio on was not measured on the two reference laptops: headless Chromium runs the model in software at about 2 fps, which says nothing about real hardware. Check with the frame-rate label before Task 02. /dev, 2026-11-04.
- **Known limitation**: which hand the model calls "Right" was checked with MediaPipe's four sample photos (a right hand, palm to the camera), not with a real hand: an unflipped image reads "Right", a flipped copy "Left". The app gives the model the unflipped camera frame, so no conversion is applied. Confirm once with a real right hand: it must light the right-hand label. /dev, 2026-11-04.
