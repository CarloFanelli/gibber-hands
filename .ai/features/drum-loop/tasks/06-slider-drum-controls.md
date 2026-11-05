# Task 06: slider-drum-controls

## Objective

Without a camera, the sliders add a drum pattern choice and a drum layers slider, and the "Start drums" button and the D key start the loop.

## Context

**Satisfies**: REQ-19

The project must degrade to sliders without a webcam. Drum mode needs a hand, so the sliders get direct controls for what the hand would set; they need Task 03's drum patterns and drum layers to steer.

## Depends on

- Task 03

## Expected Behavior

- The slider fallback adds a drum pattern choice (Rock, House, Hip-hop, Breakbeat) and a drum layers slider from 1 to 4.
- They set the loop's drum pattern and drum layers as the hand in drum mode would, landing on the next bar and the next beat.
- The "Start drums" button and the D key start and stop the loop.
- Both controls work with the keyboard and with touch.

## Acceptance Criteria

- [ ] Without a camera, the sliders show a drum pattern choice and a drum layers slider (REQ-19)
- [ ] The choice and the slider set the playing drum pattern and drum layers, from the next bar and beat (REQ-19)
- [ ] With the sliders, the button and the D key start and stop the loop (REQ-19)
- [ ] Both controls are reachable with Tab and set with the arrow keys, with focus outlines (REQ-19)

## Edge Cases

- No camera: pattern set to House, layers at 2 → plays House's kick and snare at 124 BPM (REQ-19)
- No camera: keyboard only → the pattern choice and the layers slider are reachable with Tab and the arrow keys (REQ-19)
