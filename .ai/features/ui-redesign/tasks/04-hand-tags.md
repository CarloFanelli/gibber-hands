# Task 04: hand-tags

## Objective

Each tracked hand carries one hand tag that follows it with its role, gesture and shape-mode details. The corner labels are gone, and the fps counter shows only on the F key.

## Context

**Satisfies**: REQ-24, REQ-25, REQ-26, REQ-32

This clears the camera picture, the second half of the stage work after Task 02. It changes only what is drawn over the video. The mapping, the gestures and the note lanes stay as they are.

## Depends on

- Task 02

## Expected Behavior

- Each tracked hand shows one hand tag beside it with its role and gesture, e.g. "Lead · Pinch".
- A second hand in shape mode adds the octave and the effect amount, e.g. "Second · Shape · Octave up · Reverb 40%".
- The corner labels and the old "Raise your hand" label over the video are gone. During play, only the note lanes and their labels, the hand tags and the step hints cover the picture.
- The F key shows or hides an fps counter in a corner of the stage. It starts hidden on every visit.

## Acceptance Criteria

- [ ] Each tracked hand has exactly one hand tag that follows it, with role and gesture (REQ-24)
- [ ] A shaping second hand's tag shows the octave and the effect amount in percent (REQ-24)
- [ ] No corner labels remain over the picture; only lanes, lane labels, hand tags and step hints (REQ-25)
- [ ] F shows and hides the fps counter, hidden at every page load (REQ-26, REQ-32)
- [ ] Tracking holds ≥ 25 fps with tags shown on both reference laptops (REQ-24)

## Edge Cases

- Hand at the picture's edge → the hand tag stays fully inside the picture, on the side away from the edge (REQ-24)
- Two hands overlapping → the tags stack and never cover each other (REQ-24)
- No hand in view → no tags; the step hint shows if still due (REQ-24, REQ-25)
- Sounds panel open over the camera → allowed; tags and lanes under it are hidden by it (REQ-25)
- F before tracking has started → the counter shows "— fps" until the first frame (REQ-26)
