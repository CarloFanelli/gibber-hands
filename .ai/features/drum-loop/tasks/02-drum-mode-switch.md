# Task 02: drum-mode-switch

## Objective

The rock sign 🤟 with the second hand switches it to drum mode, starting the loop if it isn't playing, and back to playing notes on the next sign. In drum mode the second hand plays no note, and the camera view labels its mode.

## Context

**Satisfies**: REQ-1, REQ-2, REQ-3, REQ-4, REQ-10, REQ-16

Drum mode is the hand's way into Task 01's loop. It joins playing notes and shape mode in the second hand's switch, so this task settles every move between the three modes before Task 03 gives the hand something to steer.

## Depends on

- Task 01

## Expected Behavior

- A rock sign 🤟 by the second hand switches it to drum mode; the next rock sign switches it back to playing notes. One sign, one switch.
- A Victory sign in drum mode switches straight to shape mode; a rock sign in shape mode switches straight to drum mode.
- In drum mode the second hand plays no note; a note it was playing fades as for a lost hand.
- Switching to drum mode starts the loop if it isn't playing (Rock, 4 drum layers on a first loop); a playing loop goes on.
- Leaving drum mode, or the second hand leaving the view, keeps the loop playing with its drum pattern and drum layers.
- The lead hand never switches modes.
- The camera view labels the second hand's mode as drum mode, beside its gesture.
- With a real hand, at least 19 of 20 rock signs by the second hand switch its mode, and no other gesture switches it in 2 minutes of playing.

## Acceptance Criteria

- [ ] A rock sign by the second hand switches it to drum mode; the next one switches it back to playing notes (REQ-1)
- [ ] A Victory sign in drum mode goes to shape mode; a rock sign in shape mode goes to drum mode (REQ-2)
- [ ] In drum mode the second hand plays no note; its sounding note fades within 100 ms (REQ-3)
- [ ] Switching to drum mode starts a stopped loop; a playing loop goes on uninterrupted (REQ-4)
- [ ] Leaving drum mode, or the view, keeps the loop playing with its drum pattern and drum layers (REQ-10)
- [ ] The camera view labels the second hand's drum mode (REQ-16)

## Edge Cases

- Rock sign with the lead hand → nothing switches (REQ-1)
- Rock sign held → one switch; switching again needs the sign dropped and shown again (REQ-1)
- Rock sign seen for less than the gesture label's confirmation time → no switch (REQ-1)
- The second hand leaves in drum mode and returns → still in drum mode (REQ-1, REQ-10)
- Page reloaded → the second hand plays notes again; the drums are stopped (REQ-1, REQ-12)
- Roles swapped while in drum mode → the new second hand plays notes; the loop keeps playing (REQ-1, REQ-10)
- Victory sign in drum mode → shape mode; the loop keeps playing (REQ-2)
- Rock sign in shape mode while the octave is raised → drum mode; notes return to the normal octave at once, the effect glides back to the preset's amount (REQ-2)
- Rock sign in shape mode while the octave is lowered → drum mode; notes return to the normal octave at once (REQ-2 · from code)
- Switch to drum mode while the second hand's note sounds → its note fades within 100 ms (REQ-3)
- Switch to drum mode before "Start audio" → the mode switches; the loop starts with the audio (REQ-4, REQ-13)
- No hand in view, loop playing → the loop goes on unchanged (REQ-10)
- Two hands play notes over the loop → the loop goes on; both notes sound over it (REQ-10)
- "Stop drums" while the second hand is in drum mode → the loop stops, and the second hand goes back to playing notes (REQ-1, REQ-11)
- Second hand leaves in drum mode → its labels go with it; the loop plays on (REQ-16)
