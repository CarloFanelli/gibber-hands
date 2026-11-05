# Task 02: octave-down-sign

## Objective

In shape mode, holding a thumbs-down with the second hand plays every note one octave lower, as bright as the normal octave, with an "Octave down" label, lower lane names and live code to match.

## Context

**Satisfies**: REQ-6, REQ-7, REQ-8, REQ-9

The octave squeeze of two-hand play, the other way down. It sits after the extra lanes because the lowered lane names cover all 16 lanes. The hand model already recognises the thumbs-down on each hand, so nothing new is downloaded.

## Depends on

- Task 01

## Expected Behavior

- In shape mode, the second hand's thumbs-down lowers every note one octave on the first tracked frame where its gesture label shows the thumbs-down, with no added smoothing; dropping the sign brings them back at once.
- A thumbs-down by the lead hand, or by the second hand while it plays notes, changes no octave; no other gesture lowers it.
- While lowered, brightness halves with the notes, so a lower note sounds as bright as the same lane in the normal octave.
- The camera view labels the shaping hand "Octave down" (its icon "↓" in a narrow view), and every lane label names its lower note.
- The live code shows the lowered notes and still runs unchanged at gibber.cc.
- The shaping hand's height keeps setting the reverb or echo amount while the thumbs-down is held.

## Acceptance Criteria

- [ ] In shape mode, the second hand's thumbs-down plays every note one octave lower from the first frame its gesture label shows it (REQ-6)
- [ ] Dropping the sign, the shaping hand leaving, or a Victory sign returns the normal octave at once, with no click (REQ-6)
- [ ] With a real hand, 19 of 20 shaping-hand thumbs-downs lower the octave; the lead hand's, or a note-playing second hand's, never do (REQ-6)
- [ ] Two hands at full squeeze on every preset's lowest lane, octave lowered, peak at or below −3 dBFS (REQ-6)
- [ ] While lowered, brightness runs from 100 Hz to 3,200 Hz; at the darkest, lanes 1–8 average within 3 dB of the normal octave (REQ-7)
- [ ] While lowered, the shaping hand shows "Octave down" and every lane label names its lower note (REQ-8)
- [ ] A snippet copied while lowered plays the same notes when pasted at gibber.cc (REQ-9)

## Edge Cases

- Thumbs-down seen for less than the gesture label's confirmation time → no change (REQ-6)
- Thumbs-down with the lead hand, or with the second hand playing notes → no octave change (REQ-6)
- Squeeze straight into a thumbs-down → the notes drop two octaves at once; an octave never slides (REQ-6)
- Thumbs-down while no note sounds → nothing sounds; the next note starts in the lower octave (REQ-6)
- Shaping hand leaves, or a Victory sign switches it back, while lowered → notes return to the normal octave at once (REQ-6)
- Height changes while the thumbs-down is held → the effect amount follows it, as in shape mode (REQ-6)
- Lowest note lowered (Deep Bass, E2 to E1, 41 Hz) → plays; laptop speakers barely reproduce it, headphones do; the peak limit holds (REQ-6)
- Darkest brightness, octave lowered → averaged over lanes 1–8, the lower octave is within 3 dB of the normal octave (REQ-7)
- Brightest, octave lowered → brightness reaches 3,200 Hz (REQ-7)
- Lowered with 16 lanes → the lane labels name all 16 lower notes (REQ-8)
- Camera panel narrower than 560 px → the label shrinks to its icon, "↓", as the other hand labels do (REQ-8)
- Snippet copied with the octave lowered → pasted at gibber.cc, it plays the same notes (REQ-9)
- No note sounding → the snippet is as today: silent, with the line that makes it sound (REQ-9)

## Notes from implementation

- **Known limitation**: AC 3 is not checked with a real hand: this machine has no camera. In headless Chromium, a stand-in camera showed the thumbs-up photo upside down. The hand model named it "Thumb down" at 95%, and it lowered the octave only as the shaping hand, not as the lead hand or as a second hand playing notes. The snippet with the octave lowered ran against stand-ins for Gibber's objects, not pasted at gibber.cc. /dev, 2026-11-05.
- **REQ-7 / AC 5 — divergence**: the spec asked the darkest lower octave to be within 3 dB of the normal octave, averaged over lanes 1–8 → measured gaps are 0.9 to 2.7 dB on four presets, but 3.2 dB on Brass and 4.5 dB on Blues Reed, the lower octave louder, steady over three runs with silence between notes. The sound stays as built, each lower note half as bright, and the check is now within 5 dB: SPEC.md is version 1.1. Peaks stay at −3.8 dBFS or lower. Agreed in /dev, 2026-11-05.
