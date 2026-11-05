# Task 06: drum-buttons

## Objective

Beside "Start drums", ◀ and ▶ step to the previous and the next drum pattern, and − and + remove or add a drum layer. They work with the loop stopped too, and the panel names the choice at once. No gesture changes the drums: drum mode and the drum mute are gone.

## Context

**Satisfies**: REQ-4, REQ-6, REQ-8, REQ-9, REQ-11

Spec 2.0 replaces drum mode, where the second hand chose the beat: played, changing the beat by hand didn't work. Buttons choose what Task 03 plays, and the hands go back to notes and shape mode only. With buttons, the no-camera path needs nothing of its own, so the sliders' drum controls are dropped.

## Depends on

- Task 01
- Task 03

## Expected Behavior

- The drum controls read, in order: ◀, "Start drums" or "Stop drums", ▶, then − and +, then the panel line.
- ◀ and ▶ step through Rock, House, Hip-hop, Breakbeat, wrapping from Breakbeat to Rock and back.
- − and + step the drum layers between 1 and 4; − is disabled at 1, + at 4.
- With the loop stopped, the buttons change the choice silently; the next start plays it.
- The panel line names the choice at once: "Drums: Rock · 110 BPM · layers 3/4" while the loop plays, "Drums off · Rock · 110 BPM · layers 3/4" while it is stopped. A pattern chosen while it plays is heard from the next bar (Task 03).
- The rock sign 🤟 and a closed fist do nothing to the drums; the second hand switches only between playing notes and shape mode, with the Victory sign.
- Once the audio engine fails, every drum button is disabled.

## Acceptance Criteria

- [ ] ◀ and ▶ step to the previous and next drum pattern, wrapping at either end (REQ-4)
- [ ] − and + remove or add one drum layer, between 1 and 4 (REQ-6)
- [ ] The buttons work while the loop is stopped or before "Start audio"; the next start plays the choice (REQ-8)
- [ ] No gesture starts, stops or changes the drums (REQ-9)
- [ ] The panel names the pattern, its tempo and the drum layers, playing or stopped (REQ-11)

## Edge Cases

- Keyboard only → the five drum buttons are reachable with Tab, with a focus outline; a screen reader names them "Previous drum pattern", "Next drum pattern", "Fewer drum layers", "More drum layers" (REQ-4, REQ-6)
- Audio engine fails to start → the drums stay stopped and every drum button is disabled (REQ-3)
- Next pattern after Breakbeat → Rock; previous before Rock → Breakbeat (REQ-4)
- − at 1 drum layer, or + at 4 → that button is disabled (REQ-6)
- Arrows, − or + while the loop is stopped, or before "Start audio" → nothing sounds; the panel shows the choice; the next start plays it (REQ-8)
- Rock sign by either hand → nothing about the drums changes; the hand plays as before (REQ-9)
- Closed fist while the drums play → that hand's note goes silent; the drums go on (REQ-9)
- No camera → the drum buttons and the D key work as with one (REQ-4, REQ-6)
- Narrow instrument panel → − and + wrap to the next row (REQ-6 · from code)

