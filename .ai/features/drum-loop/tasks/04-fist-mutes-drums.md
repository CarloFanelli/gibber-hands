# Task 04: fist-mutes-drums

## Objective

In drum mode, a closed fist mutes the drums at once; opening it brings them back in time, as if they had kept playing. Meanwhile the instrument panel says the loop is muted.

## Context

**Satisfies**: REQ-9, REQ-15

The closed fist already means silence for notes; here it silences the loop without losing its place. It follows Task 03 because what comes back is the drum pattern and drum layers the hand set while muted.

## Depends on

- Task 03

## Expected Behavior

- In drum mode, a closed fist mutes the drums at once; the loop's time runs on underneath.
- Opening the fist brings the drums back on the grid, where they would be had they kept playing.
- A squeeze in drum mode leaves the drums as they are and plays no note.
- While muted, the panel reads e.g. "Drums: Rock · 110 BPM · muted".
- Muting and unmuting make no click.

## Acceptance Criteria

- [ ] A closed fist in drum mode silences the drums at once (REQ-9)
- [ ] Opening the fist brings the drums back on the beat they would have reached (REQ-9)
- [ ] Muting and unmuting make no click (REQ-9)
- [ ] While muted, the panel adds "· muted" after the drum pattern and tempo (REQ-15)

## Edge Cases

- Squeeze in drum mode → no note; only the fist mutes (REQ-3, REQ-9)
- Drum layers changed while muted → the new layers come back with the drums (REQ-8, REQ-9)
- Fist while the loop is stopped → nothing sounds; the loop stays stopped (REQ-9)
- Fist, then the hand leaves the view → the mute ends; the drums come back in time (REQ-9, REQ-10)
- Fist held across a bar start → muted bars stay silent; the drum pattern under the hand is the one that comes back (REQ-6, REQ-9)
- Audio stopped while muted → the mute ends; "Start audio" brings the drums back unmuted if they were playing (REQ-9, REQ-13)
- Loop muted → the panel reads "Drums: Rock · 110 BPM · muted" (REQ-15)
