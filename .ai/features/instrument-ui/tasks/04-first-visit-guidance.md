# Task 04: first-visit-guidance

## Objective

A first-time visitor knows what to do. "Start audio" stands out until audio starts, a status line says what is on, and step hints over the camera view lead to the first sound, then never return.

## Context

**Satisfies**: REQ-11, REQ-12, REQ-13, REQ-14, REQ-15

This is the milestone's purpose: a stranger makes a sound within 30 seconds without reading anything. It comes after the panels and presets, so the hints and the prominent button sit in the final instrument panel and camera view.

## Depends on

- Task 01
- Task 02

## Expected Behavior

- Until audio starts, "Start audio" is the largest, highest-contrast control in the instrument panel.
- The instrument panel states camera and audio status in words, for example "Camera on · Audio off".
- Step hints over the camera view show the first step not yet done: allow the camera, raise your hand, start audio, squeeze to play.
- Each step hint shows an animated hand icon and at most four words, and disappears once its step is done.
- Once the visitor has made a sound for one second, step hints stop, now and on later visits from the same browser.
- Animations follow the system "reduce motion" setting.
- Checked by hand once this task is done: at least two of three people who have never seen the app make a sound within 30 seconds without help.

## Acceptance Criteria

- [ ] Until audio starts, "Start audio" is the largest, highest-contrast control in the instrument panel (REQ-11)
- [ ] The instrument panel states camera and audio status in words, e.g. "Camera on · Audio off" (REQ-12)
- [ ] A step hint shows the first step not done: allow the camera, raise your hand, start audio, squeeze (REQ-13)
- [ ] Each step hint has an animated hand icon and at most four words, and goes once its step is done (REQ-14)
- [ ] After one second of sound, step hints stop now and on later visits from the same browser (REQ-15)

## Edge Cases

- Audio engine failed to start → the button shows "Try again" with the same prominence (REQ-11)
- After "Stop audio" → the button keeps its normal size (REQ-11)
- Camera unavailable → status reads "Sliders · Audio off" (REQ-12)
- Audio engine failed → status reads "Audio error" (REQ-12)
- Camera blocked (slider fallback) → step hints become: start audio, lower the pinch slider (REQ-13)
- Audio started before raising the hand → "Raise your hand" shows next (REQ-13)
- Hand leaves before the first sound → the "raise your hand" step hint returns (REQ-13)
- Camera panel narrower than 320 px → icon only, no words (REQ-14)
- "Reduce motion" enabled → icon shown without animation (REQ-14)
- Browser storage blocked → step hints show on every visit until the first sound (REQ-15)
- First sound made with the sliders → counts as done (REQ-15)
- A step hint shows a step the camera view already prompts ("Allow camera access to play", "Raise your hand") → the older message is hidden while the step hint shows; once step hints are done for good, the older messages work as before (REQ-13 · from code)

## Notes from implementation

- **Known limitation**: the check with three first-time visitors (two of three make a sound within 30 seconds without help) is a manual test still to run. Only Chromium was tested, scripted in headless mode: the slider path through the first second of sound, a reload, blocked storage, a camera prompt left open, a live fake camera with no hand in it, an audio engine failure, a 300 px camera panel, reduced motion, a 160 px instrument panel, and a slider dragged through a step hint. A real hand, so the "Squeeze to play" hint and the hint's return when the hand leaves, was checked only by the unit tests of the hint rule. /dev, 2026-11-03.
- **Known limitation**: while the camera is live but the hand model is still loading, the step hint already says "Raise your hand", above the loading message. A hand raised early is picked up as soon as the model is ready. After an audio failure the step hint still says "Start audio", while the button reads "Try again". /dev, 2026-11-03.
