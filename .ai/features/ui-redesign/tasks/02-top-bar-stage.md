# Task 02: top-bar-stage

## Objective

A slim top bar always shows Start/Stop audio, the camera and audio status, the privacy note, the left-handed switch and a Help button. The camera sits whole and centred in the stage, with the sliders in its place when there is no camera.

## Context

**Satisfies**: REQ-1, REQ-2, REQ-3, REQ-4, REQ-5, REQ-6, REQ-30, REQ-31

This takes the always-needed controls out of the instrument column, so Task 03 can turn what is left (presets and drums) into the sounds panel. It also sets the studio look's colours and fonts that every later task uses. The favicon belongs to the page shell, which this task rebuilds.

## Depends on

- Task 01

## Expected Behavior

- The page has a top bar across the full width, the stage holding the camera, and the side panel on the right.
- The top bar shows the name, Start/Stop audio, the status in words, "Video stays on your device", the left-handed switch and a Help button that opens today's help.
- Until audio starts, Start audio is the largest, highest-contrast control on the page.
- A failure to start audio shows its reason in the top bar, with Try again when it can help.
- The camera picture stays whole and centred in the stage as the side panel opens, closes or resizes.
- Without a camera, the sliders take the picture's place in the stage, and camera messages appear in the stage as today.
- The studio look's colours, surfaces and fonts are set once, and the top bar uses them.
- The page has a favicon, and no "not found" error is logged for it.

## Acceptance Criteria

- [ ] The top bar stays visible and holds name, Start/Stop audio, status words, privacy note, left-handed and Help (REQ-1, REQ-4, REQ-6)
- [ ] Before audio first starts, Start audio is the page's largest and highest-contrast control (REQ-5)
- [ ] The camera picture is never cropped and stays centred while the side panel changes (REQ-2)
- [ ] With the camera blocked, the sliders fill the stage and the top bar says why (REQ-3)
- [ ] The page loads with a favicon and logs no error for it (REQ-31)
- [ ] Top bar text has ≥ 4.5:1 contrast (REQ-30)

## Edge Cases

- Camera denied or missing → the sliders fill the stage and the top bar says why in words, e.g. "Camera blocked" (REQ-3, REQ-4)
- Camera unplugged mid-play → the status turns "Camera lost" and the sliders take its place, as today (REQ-3)
- Audio fails to start (Gibber fails to load) → the top bar says "Audio failed" with the reason, and Start offers to retry (REQ-4)
- Space pressed while Start audio has focus → audio toggles once, not twice (REQ-5, REQ-32)
- Top bar on a 720–900 px window → status words shorten to icons, with the words as tooltip and screen-reader label; nothing wraps to a second line (REQ-4, REQ-6)
- Side panel at its widest leaves the stage narrower than 8 note lanes → the playing zone keeps 8 note lanes, narrower ones, as in the note-range spec (REQ-2)
- Window exactly 720 px wide → the desktop layout applies (REQ-1)
- Favicon file fails to load → the browser's default icon shows, and the page works (REQ-31)
