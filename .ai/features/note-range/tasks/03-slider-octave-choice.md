# Task 03: slider-octave-choice

## Objective

Without a camera, the player picks the octave from Down, Normal or Up in the sliders, in place of the "Octave up" switch.

## Context

**Satisfies**: REQ-10

The sliders stand in for the shaping hand when there is no camera. Now that the hand can lower the octave too, the on/off switch becomes a three-way choice. It comes after the octave-down sign, whose lowering it reuses.

## Depends on

- Task 02

## Expected Behavior

- The sliders show an Octave choice of Down, Normal and Up, starting on Normal.
- Down plays every note one octave lower, brightness halved with it, as the thumbs-down does; Up plays them one octave higher, as the "Octave up" switch did.
- The note shown beside the left–right slider names the note in the chosen octave.
- The sliders' second hand still never plays a note, whatever octave is picked.
- The help sheet's line about the sliders names the Octave choice instead of "Octave up".

## Acceptance Criteria

- [ ] The sliders show "Octave" with Down, Normal and Up; every visit starts on Normal (REQ-10)
- [ ] Octave set to Down with the pinch slider at full plays the lower octave (REQ-10)
- [ ] Octave set to Up plays the upper octave, as the "Octave up" switch did (REQ-10)
- [ ] Tab reaches the Octave choice and the arrow keys change it, with focus outlines (REQ-10)
- [ ] The sliders play one note at any octave: their second hand never sounds (REQ-10)

## Edge Cases

- No camera: Octave set to Down, pinch slider at full → plays the lower octave (REQ-10)
- No camera: lane count → always 8; the sliders have no picture to widen (REQ-1, REQ-10)
- Keyboard only → the Octave choice is reachable with Tab and the arrow keys, with focus outlines (REQ-10)
