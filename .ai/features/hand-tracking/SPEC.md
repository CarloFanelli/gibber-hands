---
feature: hand-tracking
version: 1.0
status: approved
base: 0c17c9f287212cde0addb45075c36342cf24638f
completed: true
---

# Hand Tracking

## Overview

This milestone turns the webcam into the instrument's input. When the page opens, the app asks for the camera and downloads the hand model at the same time. For every video frame it then produces one HandState: whether a hand is present, where its **palm center** is, how far the thumb is from the index and middle fingertips, and which gesture is held. A mirrored overlay draws what the tracker sees (landmarks, palm center, gesture and frame rate), so the player can trust it. Without a camera or a hand model, a visible message explains why and sliders produce the same HandState. That way milestone 2 behaves the same with or without a webcam. This milestone makes no sound.

## Project Context

- HandState is the only contract between vision and audio. MediaPipe types never leave the tracking module.
- Static site on GitHub Pages: there is no server, and everything runs in the visitor's browser.
- The hand model loads from its hosted URL and is never committed to the repo.
- The camera view and the overlay behave like a mirror.
- Failures are shown in the interface, never only in the console.
- No new dependencies. The MediaPipe runtime files must match the installed package version (1.2.0).
- This milestone produces no sound.

## Functional Requirements

### Camera

- REQ-1: On page load the app requests the front camera and shows the full video frame, mirrored, in the camera panel.
- REQ-2: If the camera can't start, the camera panel names the reason: blocked, not found, in use by another app, or page not secure.
- REQ-3: The camera error message offers a "Try again" button that requests the camera again without reloading the page.

### Hand model

- REQ-4: The hand model starts downloading on page load, in parallel with the camera request, showing its progress as a percentage.
- REQ-5: If the hand model can't load, the camera panel says so, with the reason, and offers "Try again".

### HandState

- REQ-6: Each processed video frame produces exactly one HandState; a frame is never processed twice.
- REQ-7: HandState presence turns false only after no hand is detected for 150 ms; until then the last values are held.
- REQ-8: HandState palm is the palm center (wrist and four knuckles averaged), in 0..1, with 0,0 at the mirrored view's top-left corner.
- REQ-9: HandState pinch is the thumb-to-index tip distance divided by hand size, clamped to 0..1 (0 = touching); pinchMiddle uses the middle fingertip.
- REQ-10: HandState gesture is one of the seven named MediaPipe gestures, or none, with its confidence from 0 to 1.
- REQ-11: The gesture changes only after the new gesture is reported with confidence ≥ 0.6 for at least 100 ms.
- REQ-12: With two hands in view, the tracker follows one hand and ignores the other until the followed hand is lost.

### Overlay

- REQ-13: The overlay draws the 21 landmarks, their connections and the palm center over the mirrored hand, staying aligned at any panel size.
- REQ-14: The overlay shows the gesture name and confidence, e.g. "Pointing up · 87%", or "Raise your hand" when no hand is detected.
- REQ-15: The overlay shows the tracking frame rate in frames per second, updated once per second.

### Slider fallback

- REQ-16: When the camera or hand model is unavailable, controls replace the video: four 0..1 sliders and a gesture menu, usable by keyboard and touch.
- REQ-17: Slider HandState has the tracker's fields and ranges, presence true, and is emitted when the controls appear and on every change.

## Data & Dependencies

### Information the feature must retain

- Last HandState — held for up to 150 ms after the hand is lost, then replaced by an empty one.
- Smoothing state — one per followed hand, reset when the hand has been lost for more than 150 ms.
- Nothing is persisted. The browser remembers the camera permission on its own.

### External capabilities relied on

- Camera access through the browser — gated by the visitor's permission.
- In-browser hand landmark detection and gesture classification — a hosted model file plus runtime files from a public CDN.

## Non-Functional Requirements

- **Performance** — Tracking runs at ≥ 25 frames per second, averaged over 10 s with one hand moving, in current Chrome. This must hold on both reference laptops: Intel Core i5-1240P (Windows) and Apple M1 Pro (macOS).
- **Performance** — From opening the link to the first tracked hand takes ≤ 10 s on a 20 Mbps connection with an empty cache (about 12 MB to download). Time spent on the permission prompt doesn't count.
- **Performance** — With the hand held still, the palm position varies by ≤ 0.3% of the view width (standard deviation over 1 s). During fast movement, smoothing adds ≤ 1 frame of delay.
- **Validation** — For the same hand shape, pinch differs by ≤ 15% between 40 cm and 80 cm from the camera.
- **Validation** — Every numeric HandState value is a finite number within 0..1, from both the tracker and the sliders.
- **Validation** — Unit tests on recorded or synthetic landmark data cover the conversion from landmarks to HandState, the smoothing, and the gesture debounce.
- **Validation** — Tracking works in current desktop Chrome, Edge, Firefox and Safari. The frame-rate target applies to Chrome only.
- **Security** — Video frames never leave the device, and the camera panel says "Video stays on your device".
- **Security** — The runtime files loaded from the CDN are exactly the installed package version.

## Edge Cases & Error Handling

| Edge Case | Expected Behavior | Relates to |
|-----------|-------------------|------------|
| Camera prompt not answered yet | Panel shows "Allow camera access to play"; the model keeps downloading | REQ-1 |
| Camera delivers a resolution or aspect ratio other than requested | Use what it delivers; full frame shown with letterbox bars, overlay aligned | REQ-1, REQ-13 |
| Several cameras connected | The browser's default front-facing camera is used | REQ-1 |
| Camera unplugged or stopped mid-session | "Camera disconnected" with Try again; presence turns false | REQ-1, REQ-2 |
| Camera permission blocked in site settings | Message explains how to unblock it (camera icon in the address bar); Try again stays available | REQ-2 |
| Prompt dismissed without choosing | Treated as blocked; Try again shows the prompt again | REQ-2 |
| Page opened over plain http (not localhost) | "Page not secure — open the https link" | REQ-2 |
| Browser reports an error outside the four reasons | "Camera couldn't start" plus the browser's error name | REQ-2 |
| No camera device | "No camera found" | REQ-2 |
| Camera held by another app | "Camera in use by another app — close it and try again" | REQ-2 |
| Try again clicked repeatedly | One request at a time; the button is disabled until it settles | REQ-3 |
| Still blocked on retry | Same message returns at once, no loop | REQ-3 |
| Server sends no file size | "Loading hand model…" without a percentage | REQ-4 |
| Camera ready before the model | Video shows with the progress; tracking starts when the model is ready | REQ-4 |
| Model ready before the camera | Tracking starts on the first video frame | REQ-4 |
| Second visit within the cache window | Model comes from the browser cache; progress jumps to 100% | REQ-4 |
| Offline at load | "Hand tracking unavailable: no network"; sliders shown; Try again offered | REQ-5, REQ-16 |
| Download stalls 30 s with no progress | Treated as a failure | REQ-5 |
| Runtime files blocked (firewall, content blocker) | Failure message names the file that couldn't load | REQ-5 |
| Model file corrupted or wrong format | "Hand model is damaged"; sliders shown | REQ-5 |
| Browser without WebAssembly | "This browser can't run hand tracking"; sliders shown, no Try again | REQ-5 |
| Graphics acceleration unavailable | Falls back to the processor without a message; the fps readout shows any slowdown | REQ-5, REQ-15 |
| Processing slower than the camera | Frames are skipped, never queued; the latest frame wins | REQ-6 |
| Animation loop faster than the camera | The same frame is not processed twice | REQ-6 |
| Tab in the background | Tracking pauses and resumes on return, no reload needed | REQ-6 |
| Hand lost for 100 ms, then back | Presence stays true, no gap | REQ-7 |
| Hand lost for 150 ms | Presence turns false at that moment; gesture becomes none | REQ-7, REQ-11 |
| No hand from the start | Presence false from the first frame | REQ-7 |
| Palm partly outside the frame | Values clamped to 0..1 | REQ-8 |
| Hand returns elsewhere after more than 150 ms | Smoothing restarts at the new position, no glide from the old one | REQ-8 |
| Landmarks contain non-numeric values | Frame treated as "no hand" | REQ-8 |
| Fingers spread wide | Pinch = 1 (clamped) | REQ-9 |
| Hand edge-on to the camera, hand size below 2% of frame width | Pinch values held from the previous frame | REQ-9 |
| Hand present, no named gesture | Gesture none; overlay shows "No gesture" | REQ-10, REQ-14 |
| Unknown gesture label from the model | Treated as none | REQ-10 |
| New gesture at confidence 0.59 | Ignored | REQ-11 |
| Two gestures alternating every 50 ms | Current gesture kept | REQ-11 |
| Followed hand leaves while the other stays | After 150 ms presence turns false, then the other hand is followed as a new hand | REQ-12, REQ-7 |
| Hands overlap | Tracking may switch hands; position restarts as for a new hand (accepted) | REQ-12 |
| Panel resized while playing | Overlay rescales and stays aligned | REQ-13 |
| High-density screen | Lines drawn at device resolution, not blurred | REQ-13 |
| No hand in view | Nothing drawn except the hint | REQ-13 |
| Confidence rounds up to 100 | Shows "100%" | REQ-14 |
| Less than 1 s since tracking started | Shows "— fps" | REQ-15 |
| Tab hidden, then shown | Readout restarts from "— fps" | REQ-15 |
| Camera starts working after Try again | Video replaces the sliders; only the camera emits HandState from then on | REQ-16, REQ-3 |
| Phone in portrait | Controls fit the width; touch targets ≥ 44 px | REQ-16 |
| Camera blocked | Sliders shown together with the message | REQ-16 |
| Slider at either end | Exactly 0 or exactly 1 | REQ-17 |
| Controls first shown | Palm 0.5/0.5, pinch 1, middle pinch 1, gesture none | REQ-17 |

## Out of Scope

- **Sound** — milestone 2; this one must stay silent.
- **Two-hand play** — one hand keeps the mapping and the feedback simple.
- **Handedness in HandState** — no feature uses it; dropping it keeps the contract minimal.
- **Switching to sliders while the camera works** — no present need; the fallback covers a missing or blocked camera.
- **Choosing among several cameras** — the browser's default is enough for a demo.
- **Frame-rate target on phones** — the targets are measured on laptops; phones may run slower.
- **Custom gestures or model training** — the seven built-in gestures cover the planned controls.
- **Serving the model from the repo** — CLAUDE.md says to load it from the hosted URL.
- **Panels, presets, the Start button and shortcuts** — milestone 3.
