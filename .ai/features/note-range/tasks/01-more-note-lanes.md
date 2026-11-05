# Task 01: more-note-lanes

## Objective

Widening the camera picture gives more note lanes, from 8 up to 16. Each extra lane plays the next note of the preset's scale above its top note, and is drawn and named on the camera view.

## Context

**Satisfies**: REQ-1, REQ-2, REQ-3, REQ-4, REQ-5

The player asked for more notes when the camera panel is wider. This task makes the lane count follow the camera picture's on-screen width. It comes first because the octave-down sign and the gesture guide both describe these lanes. Lanes 1–8 keep their notes, so today's default laptop layout plays as before until the camera panel widens.

## Depends on

None

## Expected Behavior

- The playing zone holds one note lane per 80 CSS px of its on-screen width, rounded down, never fewer than 8 or more than 16.
- Only the camera picture's own width counts: black bars beside it in a wider panel add no lanes.
- The count follows the picture as it resizes: while a panel divider is dragged, when the window changes size, and after a reload with the remembered panel sizes.
- Lane 9 onward plays the next notes of the preset's scale, as in the spec's table; with fewer than 16 lanes, the extra lanes are the first ones of that row.
- The overlay draws every lane, extra ones included, with its note name, and lights the lanes being played; both hands play the same lanes.
- Without a picture (camera loading, denied or missing, or the sliders in its place), there are 8 lanes.

## Acceptance Criteria

- [ ] A 719 px playing zone has 8 lanes, 720 px has 9, and 1280 px or more has 16 (REQ-1)
- [ ] Black bars beside the picture add no lanes; with no picture, or with the sliders, there are 8 (REQ-1, REQ-2)
- [ ] Dragging a panel divider changes the lane count as it moves, with no click in the sound (REQ-3)
- [ ] With 11 lanes on Saw Lead, lanes 9–11 play and name E5, G5 and A5 (REQ-4)
- [ ] Two hands at full squeeze on every preset's lane 16, octave raised, peak at or below −3 dBFS (REQ-4)
- [ ] Every lane is drawn with its note name, and the lanes being played light up (REQ-5)
- [ ] A real hand held still on a lane border doesn't flicker at 8, 12 or 16 lanes; tracking stays ≥ 25 fps with 16 (REQ-3)

## Edge Cases

- Playing zone 719 px wide, then 720 px → 8 lanes, then 9 (REQ-1)
- Playing zone 1280 px wide or more → 16 lanes (REQ-1)
- Playing zone under 640 px (a phone, stacked panels) → 8 lanes, each narrower than 80 px, as today (REQ-1)
- Browser zoomed out → the picture spans more CSS px, so more lanes, as on a bigger screen (REQ-1)
- No picture yet (camera loading, denied or missing) → 8 lanes (REQ-1)
- No camera: lane count → always 8; the sliders have no picture to widen (REQ-1, REQ-10)
- Network → N/A: the lane count is worked out on the device (REQ-1)
- Panel wider than the picture's shape → black bars at the sides; the count follows the picture's width only (REQ-2)
- Panel taller than the picture's shape → the picture fills the panel's width; the count follows it (REQ-2)
- Divider dragged while a note sounds → the lane now under the palm center plays; a new note glides in, as on any lane change (REQ-3)
- Count changes while no hand is in view → nothing sounds; the next hand plays the lane under its palm center (REQ-3)
- Palm center near a border after the count changes → the current lane holds until the palm center is 20% of a lane past its border, as today (REQ-3)
- Page reloaded → the panel sizes come back, and the lane count with them (REQ-3)
- Two hands → both play the same lanes (REQ-3, REQ-4)
- Preset switched with 12 lanes → every lane names the new preset's note at once; the sounding notes crossfade within 60 ms (REQ-4)
- Highest note raised (Warm Pad lane 16, C7 to C8) → plays; the peak limit holds (REQ-4)
- Note names with 16 lanes → every lane is at least 80 px wide, so every name fits (REQ-5)
- Camera panel narrower than 320 px → lanes drawn without names, as today (REQ-5)
