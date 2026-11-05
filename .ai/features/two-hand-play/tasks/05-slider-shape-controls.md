# Task 05: slider-shape-controls

## Objective

Without a camera, the sliders gain an "Octave up" switch and an effect slider that act like a second hand in shape mode.

## Context

**Satisfies**: REQ-21

The slider fallback stands in for one hand. This gives it shape mode's two controls, so a visitor without a camera can still jump an octave and set the effect amount.

## Depends on

- Task 03
- Task 04

## Expected Behavior

- The slider fallback shows an "Octave up" switch and an effect slider.
- With the switch on, notes play one octave up with brightness doubled, as with a held squeeze in shape mode.
- The effect slider sets the amount like the shaping hand's height: none at the bottom, the preset's own amount at the middle, double at the top, at most 80%.
- Lane labels and the live code follow both controls.

## Acceptance Criteria

- [ ] Without a camera, the sliders show an "Octave up" switch and an effect slider (REQ-21)
- [ ] With "Octave up" on and the pinch slider at full, the upper octave plays (REQ-21)
- [ ] The effect slider sets the amount like a shaping hand's height; its middle gives the preset's own amount (REQ-21)
- [ ] Both controls are reachable with Tab and show focus outlines (REQ-21)

## Edge Cases

- "Octave up" switch on, pinch slider at full → plays the upper octave (REQ-21)
- Effect slider untouched → it sits at the middle: the preset's own amount (REQ-21)
- Keyboard only → the switch and the slider are reachable with Tab, with focus outlines (REQ-21)
