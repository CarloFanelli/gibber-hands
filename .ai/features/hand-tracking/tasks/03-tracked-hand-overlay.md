# Task 03: tracked-hand-overlay

## Objective

Raise a hand and see its 21 landmarks, their connections and the palm center drawn over the mirrored video, with a frame-rate readout. Every new video frame becomes one HandState that follows one hand and says whether it is present.

## Context

**Satisfies**: REQ-6, REQ-7, REQ-8, REQ-12, REQ-13, REQ-14, REQ-15

This is the first moment the instrument sees the player, and the overlay is how the player learns to trust it. The palm center, not a fingertip, is the point that will move the note. Pinch values and the gesture label arrive in Task 04; until then HandState carries their resting values (pinch 1, gesture none).

## Depends on

- Task 01 (the video)
- Task 02 (the hand model)

## Expected Behavior

- Tracking starts as soon as both the video and the hand model are ready, whichever comes last.
- Each new video frame produces exactly one HandState. Frames the tracker has no time for are skipped, never queued.
- The palm center (wrist and four knuckles averaged) moves with the hand like in a mirror, in 0..1, with 0,0 at the top-left of what the player sees.
- The palm center is smoothed: held still it doesn't shake, and during fast movement it lags by at most one frame.
- A hand missing for less than 150 ms is still present, with its last values. At 150 ms presence turns false and the overlay says "Raise your hand".
- With two hands in view, one is followed until it has been lost for 150 ms.
- The overlay draws the 21 landmarks, their connections and the palm center, aligned with the video at any panel size and sharp on high-density screens.
- The frame-rate readout updates once per second.
- From opening the link to the first tracked hand takes ≤ 10 s on a 20 Mbps connection with an empty cache, not counting the time on the camera prompt.
- Tracking works in current desktop Chrome, Edge, Firefox and Safari.

## Acceptance Criteria

- [ ] Each new video frame yields exactly one HandState; no frame is processed twice (REQ-6)
- [ ] Moving the hand to the player's right moves the palm center right; its values stay within 0..1 (REQ-8)
- [ ] With the hand held still, the palm center varies by ≤ 0.3% of the view width over 1 s (REQ-8)
- [ ] A hand hidden for under 150 ms stays present; at 150 ms presence turns false and "Raise your hand" shows (REQ-7, REQ-14)
- [ ] With two hands in view, the overlay follows one until it is lost (REQ-12)
- [ ] Landmarks, connections and palm center stay aligned with the mirrored hand after the window is resized (REQ-13)
- [ ] The frame-rate readout updates once per second and reads ≥ 25 fps in Chrome on both reference laptops (REQ-15)

## Edge Cases

- Camera ready before the model → tracking starts when the model is ready (REQ-4)
- Model ready before the camera → tracking starts on the first video frame (REQ-4)
- Camera delivers another aspect ratio → the overlay stays aligned with the letterboxed video (REQ-1, REQ-13)
- Camera unplugged or stopped mid-session → presence turns false (REQ-1, REQ-2)
- Processing slower than the camera → frames are skipped, never queued; the latest frame wins (REQ-6)
- Animation loop faster than the camera → the same frame is not processed twice (REQ-6)
- Tab in the background → tracking pauses and resumes on return, no reload needed (REQ-6)
- Hand lost for 100 ms, then back → presence stays true, no gap (REQ-7)
- Hand lost for 150 ms → presence turns false at that moment (REQ-7)
- No hand from the start → presence false from the first frame (REQ-7)
- Palm partly outside the frame → values clamped to 0..1 (REQ-8)
- Hand returns elsewhere after more than 150 ms → smoothing restarts at the new position, no glide from the old one (REQ-8)
- Landmarks contain non-numeric values → the frame is treated as "no hand" (REQ-8)
- Followed hand leaves while the other stays → after 150 ms presence turns false, then the other hand is followed as a new hand (REQ-12, REQ-7)
- Hands overlap → tracking may switch hands; the position restarts as for a new hand (accepted) (REQ-12)
- Panel resized while playing → the overlay rescales and stays aligned (REQ-13)
- High-density screen → lines drawn at device resolution, not blurred (REQ-13)
- No hand in view → nothing drawn except the hint (REQ-13)
- Graphics acceleration unavailable → the frame-rate readout shows any slowdown (REQ-15)
- Less than 1 s since tracking started → shows "— fps" (REQ-15)
- Tab hidden, then shown → the readout restarts from "— fps" (REQ-15)
- Tab switched away while a hand is tracked → presence turns false at once; tracking resumes on return (REQ-7 · from code)

## Notes from implementation

- **Known limitation**: the frame-rate target (≥ 25 fps in Chrome on both reference laptops) could not be measured here. Headless Chromium under WSL has only software WebGL: MediaPipe's GPU path starts there but takes about 450 ms per frame, against about 50 ms on the processor (measured on this i5-1240P), so tracking ran at 2–3 fps. It must be checked by hand in desktop Chrome with hardware acceleration on both laptops. /dev, 2026-11-02.
