# Task 03: pattern-and-layers

## Objective

In drum mode, the second hand's palm center picks one of four drum patterns, each at its own tempo, and its height sets 1 to 4 drum layers. Changes land on the next bar or beat, and the hand's label names both, e.g. "Rock 3/4".

## Context

**Satisfies**: REQ-5, REQ-6, REQ-7, REQ-8, REQ-14, REQ-15, REQ-16

This gives drum mode its purpose: the hand steers the loop Task 01 plays. Changes wait for the bar or the beat so the loop never stumbles, and a tempo change carries the echo and the panel with it.

## Depends on

- Task 02

## Expected Behavior

- In drum mode the playing zone holds the four drum patterns side by side, left to right: Rock 110 BPM, House 124 BPM, Hip-hop 90 BPM, Breakbeat 130 BPM, each with the feel the spec tables.
- A drum pattern change, tempo included, lands at the start of the next bar.
- The playing zone holds four equal height bands: 1 drum layer at the bottom, 4 at the top. Layers add in order: kick; snare; closed hi-hat; the full pattern with its extra hits.
- A drum layers change lands on the next beat.
- The panel shows the drum pattern and tempo playing, e.g. "Drums: House · 124 BPM".
- While the loop plays, the echo on Organ and Blues Reed follows the new tempo from the bar it changes on.
- The camera view labels the second hand in drum mode with the drum pattern under it and its drum layers, e.g. "Rock 3/4".
- Drum pattern, drum layers and tempo changes make no click; every drum pattern at 4 layers plus two hands at full squeeze, brightest, octave raised, peaks at or below −3 dBFS on every preset.

## Acceptance Criteria

- [ ] The palm center, left to right across the playing zone, picks Rock, House, Hip-hop, Breakbeat, each at its tabled tempo (REQ-5)
- [ ] A drum pattern change, tempo included, is heard from the start of the next bar (REQ-6)
- [ ] Height picks 1 to 4 drum layers in four equal bands, bottom to top, heard from the next beat (REQ-7, REQ-8)
- [ ] After a tempo change the echo keeps its length in beats from the next bar, without a click (REQ-14)
- [ ] The panel names the drum pattern and tempo playing; the camera label names the pattern under the hand and its layers (REQ-15, REQ-16)

## Edge Cases

- Switch to drum mode while the loop plays → the loop goes on; the hand takes over drum pattern and drum layers from where it is (REQ-4)
- Palm center left of the playing zone → Rock (REQ-5)
- Palm center right of the playing zone → Breakbeat (REQ-5)
- Palm center on a pattern border → the drum pattern holds until the palm center is 20% of a pattern's width past it, as note lanes do (REQ-5)
- Hand crosses two drum patterns within one bar → only the pattern under the hand at the bar's start plays (REQ-6)
- Tempo change while the echo rings → the echo's time follows at the bar start, without a click (REQ-6, REQ-14)
- Hand above or below the playing zone → 4 or 1 drum layers (REQ-7)
- Hand on a layer border → the drum layers hold until the hand is 20% of a band past it (REQ-7)
- Hand sweeps from bottom to top within one beat → the next beat plays 4 drum layers (REQ-8)
- Loop started from the button → Rock with 4 drum layers, or the last drum pattern and drum layers of this visit (REQ-11, REQ-12)
- Camera panel narrower than 560 px → the drum labels shrink to their icons, as the other hand labels do (REQ-16)

## Notes from implementation

- **Known limitation**: the House, Hip-hop and Breakbeat hits and the open hi-hat's sound were written from the feel the spec tables, not heard; like the drum mix in Task 01, they need a listen before the review. /dev, 2026-11-05.
