# Task 05: readme-gif

## Objective

The README opens with a silent, looping 5-second GIF of a hand playing. It shows the overlay, a note lane change, a squeeze and the live code updating, and it takes the place of the TODO comment.

## Context

**Satisfies**: REQ-5, REQ-6, REQ-19

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
- [ ] A link right under the GIF plays the demo video with sound in the browser, from its address on the live site (REQ-19)

## Edge Cases

- GIF over 4 MB → re-encoded (fewer colours or frames) before commit (REQ-5)
- GIF path → stored in the repo and linked relatively, so it renders on github.com (REQ-5)
- The README's "TODO … GIF goes here" comment → replaced by the GIF; no TODO comment left in the README (REQ-5)
- Recording shows something private (notifications, other tabs) → re-recorded (REQ-6)
- N/A — network: the GIF is a file in the repo (REQ-6)
- Original recording over GitHub's 100 MB file limit → the repo keeps a re-encoded MP4; the original stays out of git (REQ-19)
- GitHub's file page refuses a video this big → the link is the video's absolute address on the live site, checked after the push (REQ-19)
- Recording shows something private → re-recorded, as for the GIF (REQ-19)

## Notes from implementation

- Measured from the file's bytes on 2026-11-09: 800×456, 60 frames, 5.01 s, loops forever, 3.46 MB. Frames read by the agent: overlay, lane changes, squeeze and live code all show, and nothing private. /dev, 2026-11-09.
- Carlo saw the GIF playing on github.com. GitHub's file page answered "we can't show files that are this big" for the video, so it moved to `public/`. Pending push: the video playing from the live site. /dev, 2026-11-09.
