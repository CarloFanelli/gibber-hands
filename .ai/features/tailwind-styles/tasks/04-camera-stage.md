# Task 04: camera-stage

## Objective

The camera view, the sliders, the status cards, the hand tags, the frame rate and the step hints are styled with Tailwind utilities and look exactly as today.

## Context

**Satisfies**: REQ-1, REQ-3, REQ-6

The stage holds the elements drawn over the video, which adapt to the camera view's own width and animate; it is independent of the side panel.

## Depends on

- Task 02

## Expected Behavior

- The camera view, video, sliders, status cards, hand tags, frame rate and step hints take their styles from utilities.
- Without a camera, the sliders, status cards and Try again look as today.
- Step hint icons animate as today, and not at all with reduced motion.
- The look check reports no difference for any screen.

## Acceptance Criteria

- [ ] The stage's elements have no styles left in the hand-written stylesheet, except the mirror and the animations (REQ-6)
- [ ] The look check reports no difference at 1280, 1000, 390 and 360 px, sliders screen included (REQ-1)
- [ ] Hand tag and step hint words hide below the same camera view widths as today (REQ-3)
- [ ] Reduced motion stops the step hint animations (REQ-3)

## Edge Cases

- Camera view at 559/560 and 319/320 px → hand tag and step hint words hide below the same widths as today (REQ-3)
- No camera: sliders fill the stage → sliders, status cards and Try again look as today (REQ-1, REQ-2)
- Reduced motion turned on in the system → step hint icons don't animate (REQ-3)

## Notes from implementation

- **Impacts Task 02–05**: under the utilities sit the browser's own defaults for buttons, inputs, selects and dialogs (Task 01 base layer), not Tailwind's resets: a moved rule keeps every property it set, `font: inherit` included. Check each move with `npm run look -- capture .look/now` then `compare .look/baseline .look/now`. /dev, 2026-11-11.
