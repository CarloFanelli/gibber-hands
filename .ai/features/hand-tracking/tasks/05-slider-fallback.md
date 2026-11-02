# Task 05: slider-fallback

## Objective

When the camera or the hand model is unavailable, four sliders and a gesture menu take the video's place and produce the same HandState as the tracker. Milestone 2 then behaves the same with or without a webcam.

## Context

**Satisfies**: REQ-16, REQ-17

This task comes last because the sliders copy the HandState fields and ranges that Tasks 03 and 04 define. The sliders appear together with the failure messages from Tasks 01 and 02, which stay visible with their Try again.

## Depends on

- Task 01 and Task 02 (the failures that bring up the sliders)
- Task 04 (the complete HandState and the gesture list)

## Expected Behavior

- When the camera can't start or the hand model can't load, four 0..1 sliders take the video's place: palm center left–right, palm center up–down, pinch and middle pinch. A gesture menu offers the seven gestures plus none. The failure message stays visible next to them.
- The controls work with the keyboard alone and with touch.
- When the controls appear, they emit one HandState: palm center 0.5/0.5, pinch 1, middle pinch 1, gesture none, presence true.
- Every change emits a HandState with the tracker's fields and ranges. A gesture picked from the menu has confidence 1; none has confidence 0.
- Once both the camera and the hand model work, for example after a successful Try again, the video replaces the sliders and only the tracker emits HandState.

## Acceptance Criteria

- [ ] With the camera blocked, four sliders and a gesture menu appear in the camera panel next to the message (REQ-16)
- [ ] With the camera working but the hand model failed, the sliders replace the video (REQ-16)
- [ ] Every slider and the gesture menu work with the keyboard alone and with touch (REQ-16)
- [ ] When the controls appear, one HandState is emitted: palm center 0.5/0.5, pinch 1, middle pinch 1, gesture none, presence true (REQ-17)
- [ ] Each change emits a HandState with the tracker's fields, every number finite and within 0..1 (REQ-17)
- [ ] After a successful Try again, the video replaces the sliders and the sliders emit nothing more (REQ-16)

## Edge Cases

- Offline at load → sliders shown with the message and Try again (REQ-5, REQ-16)
- Model file corrupted or wrong format → sliders shown (REQ-5, REQ-16)
- Browser without WebAssembly → sliders shown, no Try again (REQ-5, REQ-16)
- Camera blocked → sliders shown together with the message (REQ-16)
- Camera starts working after Try again → the video replaces the sliders; only the camera emits HandState from then on (REQ-16, REQ-3)
- Phone in portrait → the controls fit the width; touch targets ≥ 44 px (REQ-16)
- Slider at either end → exactly 0 or exactly 1 (REQ-17)
- Controls first shown → palm center 0.5/0.5, pinch 1, middle pinch 1, gesture none (REQ-17)
- Camera lost mid-session → the sliders appear next to "Camera disconnected" until Try again brings the camera back (REQ-16 · from code)
