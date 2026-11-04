# Task 04: effect-by-height

## Objective

In shape mode, the second hand's height sets the reverb or echo amount, from none at the bottom of the playing zone to double the preset's own amount at the top, at most 80%. The camera view shows the amount in percent and the live code carries it.

## Context

**Satisfies**: REQ-12, REQ-13, REQ-14, REQ-15, REQ-17

This completes shape mode on top of Task 03's switch and octave: the same hand now also shapes how much the sound rings or echoes.

## Depends on

- Task 03

## Expected Behavior

- In shape mode, the second hand's height sets the reverb or echo amount: none at the bottom of the playing zone, the preset's own amount at the middle, double at the top, never above 80%.
- The amount glides when it changes, with no zipper noise.
- Without a second hand in shape mode, the preset's own effect amount applies.
- While the second hand shapes, the camera view shows the amount in percent.
- The live code carries the current effect amount and still runs unchanged at gibber.cc.

## Acceptance Criteria

- [ ] In shape mode, the bottom of the playing zone gives no effect, the middle the preset's amount, the top double (REQ-12, REQ-13)
- [ ] The top amount never exceeds 80%: Warm Pad gives 80%, not 120% (REQ-13)
- [ ] Without a second hand in shape mode, the preset's own effect amount applies (REQ-14)
- [ ] While the second hand shapes, the camera view shows the effect amount in percent (REQ-15)
- [ ] Pasted at gibber.cc with the octave raised and the amount at 45%, the snippet plays the same notes and amount (REQ-17)
- [ ] Effect amount changes glide with no zipper noise (REQ-12)

## Edge Cases

- Only the second hand in view, in shape mode → no sound; the effect amount still follows it (REQ-4)
- Switch back to playing while the octave is raised → the effect glides back to the preset's amount (REQ-8, REQ-14)
- Shaping hand above or below the playing zone → the amount stays at the top or bottom value (REQ-12)
- Effect amount changes → it glides, no zipper noise (REQ-12)
- Warm Pad (60%) at the top → 80%, not 120% (REQ-13)
- Preset switched while shaping → the same height gives the new preset's scaled amount (REQ-13)
- No hand in view → the preset's own effect amount (REQ-2, REQ-14)
- Shaping hand leaves while the octave is raised → the effect glides back to the preset's amount (REQ-14)
- Camera panel narrower than 320 px → the amount shows as a number only (45%) (REQ-15)
- Snippet copied with the octave raised and the effect at 45% → pasted at gibber.cc, it plays the same notes and amount (REQ-17)
