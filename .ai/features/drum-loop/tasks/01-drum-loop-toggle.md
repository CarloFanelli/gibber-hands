# Task 01: drum-loop-toggle

## Objective

The player can start and stop a synthesized drum loop with a "Start drums" button or the D key. A first loop plays Rock at 110 BPM with all 4 drum layers, the instrument panel shows its state, and the echo keeps time with it.

## Context

**Satisfies**: REQ-11, REQ-12, REQ-13, REQ-14, REQ-15

The loop comes first: every later task steers it (drum mode, drum patterns, mute, live code). Starting it from a button gives a playable result before any gesture, and puts the drum sounds and their timing in place for the hand to steer.

## Depends on

None

## Expected Behavior

- The instrument panel has a button reading "Start drums" or "Stop drums"; the D key presses it.
- A first loop of the visit plays the Rock drum pattern at 110 BPM with 4 drum layers: kick, snare on 2 and 4, eighth-note hi-hats, and its extra hits.
- The drum sounds are synthesized in the browser; nothing is downloaded for them.
- Drums never sound before "Start audio": a loop started earlier waits, silent, and starts with the audio.
- "Stop audio" stops the drums with everything else; "Start audio" brings them back only if they were playing.
- The panel reads "Drums: Rock · 110 BPM" while the loop plays, "Drums off" while it is stopped.
- While the loop plays, the echo on Organ and Blues Reed keeps its length in beats at the drum tempo; once stopped, it returns to today's timing at once.
- Hits stay on the tempo's grid whatever tracking does: over 5 minutes, none drifts by more than 1 ms.
- The loop at 4 drum layers plus two hands at full squeeze, brightest, octave raised, peaks at or below −3 dBFS on every preset.
- Starting and stopping the loop makes no click.

## Acceptance Criteria

- [ ] "Start drums" or the D key starts a Rock loop at 110 BPM with 4 drum layers; pressed again, it stops (REQ-11, REQ-12)
- [ ] The button reads "Start drums" or "Stop drums"; the panel reads "Drums: Rock · 110 BPM" or "Drums off" (REQ-11, REQ-15)
- [ ] "Stop audio" silences the drums; "Start audio" brings them back only if they were playing (REQ-13)
- [ ] No drum sounds before the visit's first "Start audio" click (REQ-13)
- [ ] While the loop plays, Organ's and Blues Reed's echo keeps its length in beats at 110 BPM (REQ-14)
- [ ] Over 5 minutes no hit drifts over 1 ms from the grid; starting and stopping make no click (REQ-12)

## Edge Cases

- D key while the help sheet is open → starts or stops the drums, as 1–6 and C do; the spec's "ignored" row assumed those keys were ignored, and they aren't (REQ-11 · from code)
- D key while typing in a field → ignored (REQ-11)
- Keyboard only → the button is reachable with Tab, with a focus outline (REQ-11)
- Audio engine fails to start → the drums stay stopped, and the existing audio error says why (REQ-13)
- A preset without echo → nothing follows the tempo; the preset sounds as today (REQ-14)
- Loop stopped → the echo returns to today's timing at once, without a click (REQ-14)
- Loop stopped → the panel reads "Drums off" (REQ-15)
- N/A — network: drums are synthesized on the device; no sample downloads (REQ-4, REQ-11)
