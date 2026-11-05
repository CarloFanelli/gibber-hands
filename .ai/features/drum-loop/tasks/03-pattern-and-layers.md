# Task 03: pattern-and-layers

## Objective

The loop can play four drum patterns, each at its own tempo, with 1 to 4 drum layers. A drum pattern change, tempo included, lands at the start of the next bar and a drum layers change on the next beat, and the echo follows the new tempo.

## Context

**Satisfies**: REQ-5, REQ-7, REQ-10

This gives the loop its choices. Changes wait for the bar or the beat so the loop never stumbles, and a tempo change carries the echo with it. Task 06's buttons make the choice; in 1.x the second hand did, in drum mode (dropped in spec 2.0).

## Depends on

- Task 01

## Expected Behavior

- Four drum patterns: Rock 110 BPM, House 124 BPM, Hip-hop 90 BPM, Breakbeat 130 BPM, each with the feel the spec tables.
- A drum pattern change, tempo included, lands at the start of the next bar.
- Drum layers add in order: kick; snare; closed hi-hat; the full pattern with its extra hits.
- A drum layers change lands on the next beat.
- The worklet reports the drum pattern and drum layers it starts playing, on the bar or beat they land.
- While the loop plays, the echo on Organ and Blues Reed follows the new tempo from the bar it changes on.
- Drum pattern, drum layers and tempo changes make no click; every drum pattern at 4 layers plus two hands at full squeeze, brightest, octave raised, peaks at or below −3 dBFS on every preset.

## Acceptance Criteria

- [ ] Each of the four drum patterns plays at its tabled tempo, with the feel the spec tables (REQ-5)
- [ ] A drum pattern change, tempo included, is heard from the start of the next bar (REQ-5)
- [ ] 1 to 4 drum layers play the tabled parts, and a change is heard from the next beat (REQ-7)
- [ ] After a tempo change the echo keeps its length in beats from the next bar, without a click (REQ-10)

## Edge Cases

- Several drum patterns chosen within one bar → only the last one plays, from the next bar (REQ-5)
- Tempo change while the echo rings → the echo's time follows at the bar start, without a click (REQ-5, REQ-10)
- Drum layers changed several times within one beat → the next beat plays the last count (REQ-7)

## Notes from implementation

- **Known limitation**: the House, Hip-hop and Breakbeat hits and the open hi-hat's sound were written from the feel the spec tables, not heard; like the drum mix in Task 01, they need a listen before the review. /dev, 2026-11-05.
- Spec 2.0 removed what this task first gave the hand: the playing zone's pattern and height bands, the band rule exported from `handToSynth.ts` for them (note lanes are back on their own `noteLane`), and the "Rock 3/4" camera label. The patterns, the bar and beat landing and the worklet's reports stay. /dev, 2026-11-05.
