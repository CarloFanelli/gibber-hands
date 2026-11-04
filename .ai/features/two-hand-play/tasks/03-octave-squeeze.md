# Task 03: octave-squeeze

## Objective

The Victory sign with the second hand switches it to shape mode and back. In shape mode, holding its squeeze lifts every note one octave at once, brightness follows, and the camera view, lane labels and live code show it.

## Context

**Satisfies**: REQ-4, REQ-8, REQ-9, REQ-10, REQ-11, REQ-14, REQ-15, REQ-16, REQ-17

The fast jump to the upper octave is the reason for this milestone. Shape mode's other half, the effect amount from height, follows in Task 04 on the same switch.

## Depends on

- Task 02

## Expected Behavior

- The Victory sign with the second hand switches it between playing notes and shape mode, once per sign. The lead hand's Victory sign switches nothing.
- The second hand starts every visit playing notes; its mode lasts until the next Victory sign, even while it is out of view.
- In shape mode the second hand plays no note.
- In shape mode, holding the squeeze closed to the full-volume level raises every note one octave on the first tracked frame; opening it clearly past that level brings them back at once.
- While the octave is raised, brightness doubles, so upper notes sound as bright as the same lane below.
- Without a second hand in shape mode, notes play in the normal octave.
- The camera view labels the second hand's mode, and "Octave up" while the octave is raised. The lane labels name the notes in the octave being played.
- The live code shows the sounding notes in the current octave.

## Acceptance Criteria

- [ ] A Victory sign by the second hand switches its mode once; the lead hand's Victory sign switches nothing (REQ-8)
- [ ] The second hand starts each visit playing notes and stays in shape mode while out of view (REQ-9)
- [ ] In shape mode, a held squeeze raises every note one octave on the first tracked frame; opening returns at once (REQ-10)
- [ ] With the octave raised, brightness doubles; the darkest upper note is within 3 dB of the same lane below (REQ-11)
- [ ] The camera view labels the mode and "Octave up"; lane labels show the upper notes at once (REQ-15, REQ-16)
- [ ] Pasted at gibber.cc, the live code plays the same notes in the same octave (REQ-17)
- [ ] Octave jumps make no click or zipper noise (REQ-10)

## Edge Cases

- Only the second hand in view, in shape mode → no sound; the octave still follows it (REQ-4)
- Roles swapped while playing → the second hand goes back to playing notes (REQ-3, REQ-9)
- The lead hand shows the Victory sign → nothing switches; its note is silent while its fingers are apart, as today (REQ-5)
- Victory sign with both hands at once → only the second hand switches (REQ-5, REQ-8)
- Victory sign held → one switch; switching again needs the sign dropped and shown again (REQ-8)
- Victory sign seen for less than the gesture label's confirmation time → no switch (REQ-8)
- Victory chosen in the sliders' gesture menu → nothing switches: the sliders are the lead hand (REQ-8 · from code)
- The second hand leaves showing the Victory sign and comes back still showing it → counts as a new sign: one switch (REQ-8 · from code)
- Switch to shape mode while the second hand's note sounds → its note fades within 100 ms, as for a lost hand (REQ-8)
- Switch back to playing while the octave is raised → the octave returns to normal at once (REQ-8, REQ-14)
- The second hand leaves in shape mode and returns → still in shape mode (REQ-9)
- Page reloaded → the second hand plays notes again (REQ-9)
- Squeeze hovering near the octave level → the octave goes up at the full-volume squeeze level and back only once the squeeze opens clearly past it (tuned by ear): no flicker (REQ-10)
- Closed fist with the shaping hand → not a squeeze: the octave stays normal (REQ-10)
- Octave raised while no hand plays → nothing sounds; the next note starts in the upper octave (REQ-10)
- Octave jump and lane change at the same moment → both land at once; an octave never slides (REQ-10)
- Octave raised on the highest note (Warm Pad, E5 to E6) → plays; the peak limit holds (REQ-10, REQ-11)
- Darkest brightness, octave raised → the upper note is within 3 dB of the same lane in the normal octave (REQ-11)
- Brightest, octave raised → brightness reaches 12,800 Hz; the peak limit holds (REQ-11)
- No hand in view → normal octave (REQ-2, REQ-14)
- Shaping hand leaves while the octave is raised → notes drop to the normal octave at once (REQ-14)
- Camera panel narrower than 320 px → the labels shrink to icons (✌, ↑) (REQ-15)
- No second hand in view → no second-hand labels (REQ-15)
- Octave raised → lane labels show the upper notes at once (Saw Lead: A4 … D6) (REQ-16)
