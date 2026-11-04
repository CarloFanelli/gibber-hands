# Task 02: two-notes-at-once

## Objective

The second hand plays its own note alongside the lead hand, so two notes sound at once. Both hands' note lanes light up and the live code holds both voices.

## Context

**Satisfies**: REQ-5, REQ-6, REQ-7, REQ-16, REQ-17

This closes the gap Task 01 leaves and is what the player asked for first: playing with both hands. Shape mode, next, builds on it: the second hand stops its note to shape both.

## Depends on

- Task 01

## Expected Behavior

- Each hand plays its own note with the existing rules: note lane from the palm center, brightness from height, volume from squeeze, silence from a closed fist.
- Both hands play the current preset's 8 note lanes in the same octave.
- Each playing hand's note lane is lit in the camera view.
- The live code shows every sounding note: two voices while both hands sound, today's single voice while one does. It still runs unchanged at gibber.cc.
- One hand alone sounds within 1 dB of today's level; two hands at full squeeze and brightest peak at or below −3 dBFS on every preset.
- Notes starting, stopping and changing make no click or zipper noise.

## Acceptance Criteria

- [ ] Two hands in different note lanes sound two notes at once (REQ-5, REQ-7)
- [ ] A closed fist silences only that hand's note (REQ-6)
- [ ] Both playing hands' note lanes are lit in the camera view (REQ-16)
- [ ] The live code holds two voices while two notes sound, and runs unchanged at gibber.cc (REQ-17)
- [ ] One hand alone is within 1 dB of today; two hands peak at or below −3 dBFS on every preset (REQ-7)

## Edge Cases

- A lone left hand is playing when the right hand appears → the left keeps playing its note; both hands now play (REQ-4, REQ-5)
- One hand makes a fist while the other squeezes → only the fist hand's note goes silent (REQ-6)
- One hand leaves the view → only its note fades, over 100 ms as today (REQ-6)
- Tab hidden → both hands count as gone; both notes fade (REQ-6)
- Both hands in the same lane → both play the same note; the peak limit still holds (REQ-7)
- Preset switched while two hands play → both notes crossfade within 60 ms, each keeping its lane (REQ-7)
- Two hands in different lanes → both lanes lit (REQ-16)
- Two notes sounding → the snippet holds both voices; one note gives today's single voice (REQ-17)
- No note sounding → the snippet is as today: silent, with the line that makes it sound (REQ-17)

## Notes from implementation

- **Known limitation**: the frame rate with two hands and audio on is still unmeasured on the reference laptops. In headless Chromium on an i5-1240P, the 12 voices raised Chromium's processor load from 0.39 to 0.43 cores, and two hands sounded without a break. /dev, 2026-11-04.
- **Known limitation**: the two-voice live code was run against stand-ins for Gibber's stock objects, not pasted at gibber.cc. It uses only the stock calls the single voice already used. /dev, 2026-11-04.
