# Task 05: readme-gif

## Objective

The README opens with a silent, looping 5-second GIF of a hand playing. It shows the overlay, a note lane change, a squeeze and the live code updating, and it takes the place of the TODO comment.

## Context

**Satisfies**: REQ-5, REQ-6

The GIF is the first thing a visitor to the repo sees. Without it, the project looks like a slider interface. Carlo records it, since it needs his hand and camera. This task turns the recording into a GIF within the size limits and puts it at the top of the README.

## Depends on

None

## Expected Behavior

- Right under the README's opening line, a GIF of a hand playing: about 5 seconds, looping, silent, at most 800 px wide and 4 MB.
- Its frames show the overlay on the hand, a change of note lane, a squeeze that plays, and the live code changing.
- The GIF is kept in the repo and linked with a relative path, so it shows on github.com.
- The "TODO … GIF goes here" comment is gone.

## Acceptance Criteria

- [ ] The README shows the GIF right after its opening line, and no TODO comment is left (REQ-5)
- [ ] The GIF loops, lasts about 5 seconds, is at most 800 px wide and at most 4 MB (REQ-5)
- [ ] The GIF renders on github.com from a relative path in the repo (REQ-5)
- [ ] The GIF shows the overlay, a note lane change, a squeeze and the live code updating (REQ-6)
- [ ] No notification, other tab or private detail shows in any frame (REQ-6)

## Edge Cases

- GIF over 4 MB → re-encoded (fewer colours or frames) before commit (REQ-5)
- GIF path → stored in the repo and linked relatively, so it renders on github.com (REQ-5)
- The README's "TODO … GIF goes here" comment → replaced by the GIF; no TODO comment left in the README (REQ-5)
- Recording shows something private (notifications, other tabs) → re-recorded (REQ-6)
- N/A — network: the GIF is a file in the repo (REQ-6)
