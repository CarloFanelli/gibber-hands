# Task 01: camera-view

## Objective

When the page opens, the app asks for the camera and shows the full video, mirrored, in the camera panel. If the camera can't start, the panel names the reason and offers Try again without reloading the page.

## Context

**Satisfies**: REQ-1, REQ-2, REQ-3

The camera is the instrument's input, so every later task builds on it. Failures appear in the interface, never only in the console. The hand model download (Task 02) runs alongside this request and shows its own status in the same panel.

## Depends on

None

## Expected Behavior

- On page load, with no click, the browser asks for the front-facing camera.
- While the prompt is unanswered, the camera panel shows "Allow camera access to play".
- Once allowed, the full video frame fills the camera panel, mirrored: a hand raised on the player's right appears on the right of the screen.
- When the video's aspect ratio differs from the panel's, the whole frame stays visible with bars at the sides or at the top and bottom. Nothing is cropped.
- The camera panel says "Video stays on your device".
- If the camera can't start, the panel names the reason: blocked, not found, in use by another app, or page not secure. Any other error shows "Camera couldn't start" with the browser's error name.
- Every camera failure message has a Try again button that asks for the camera again without reloading the page.

## Acceptance Criteria

- [ ] Opening the page shows the browser's camera prompt without any click (REQ-1)
- [ ] After allowing, the whole video frame shows mirrored in the camera panel, letterboxed and never cropped (REQ-1)
- [ ] The camera panel shows "Video stays on your device" (REQ-1)
- [ ] A blocked, missing, busy or insecure-page camera each shows its own named reason (REQ-2)
- [ ] Try again asks for the camera again without a reload, and stays disabled until the request settles (REQ-3)
- [ ] Allowing the camera after Try again shows the video and removes the message (REQ-3)

## Edge Cases

- Camera prompt not answered yet → "Allow camera access to play"; the hand model keeps downloading (REQ-1)
- Camera delivers a resolution or aspect ratio other than requested → use what it delivers; full frame shown with letterbox bars (REQ-1)
- Several cameras connected → the browser's default front-facing camera is used (REQ-1)
- Camera unplugged or stopped mid-session → "Camera disconnected" with Try again (REQ-1, REQ-2)
- Camera permission blocked in site settings → the message explains how to unblock it (camera icon in the address bar); Try again stays available (REQ-2)
- Prompt dismissed without choosing → treated as blocked; Try again shows the prompt again (REQ-2)
- Page opened over plain http (not localhost) → "Page not secure — open the https link" (REQ-2)
- Browser reports an error outside the four reasons → "Camera couldn't start" plus the browser's error name (REQ-2)
- No camera device → "No camera found" (REQ-2)
- Camera held by another app → "Camera in use by another app — close it and try again" (REQ-2)
- Try again clicked repeatedly → one request at a time; the button is disabled until it settles (REQ-3)
- Still blocked on retry → the same message returns at once, no loop (REQ-3)
