# gibber-hands

Play a synth with your hands. Webcam → MediaPipe gesture recognition → [Gibber](https://github.com/charlieroberts/gibber.audio.lib) audio, in the browser, with the live-coding snippet that reproduces what you're playing shown next to the video.

<!-- TODO (milestone 4): 5-second GIF here -->

**Status:** in development, milestone 1 of 4 (hand tracking). The live demo will be at https://carlofanelli.github.io/gibber-hands/ once milestone 4 ships. Without a webcam, sliders take over.

## How to play (planned)

The controls as specified in [`.ai/features/`](.ai/features/). They're not built yet.

| Hand | Sound |
|---|---|
| Move the hand left/right | note: 8 lanes across the middle of the view, drawn on the video |
| Move it up/down | brightness (filter cutoff) |
| Squeeze thumb and index | volume: touching is full, apart is silent, so a relaxed hand is quiet |
| Closed fist | mute |

Pick one of six presets (click, drag it onto "Now playing", or keys 1–6), press **Start audio**, raise your hand and squeeze.

## How it works

```
webcam ─► hands/tracker ─► HandState ─► mapping/handToSynth ─► SynthParams ─► synth/engine (Gibber)
                               │                                                      │
                               └─► ui (overlay, sliders fallback, panels, live code) ◄─┘
```

`HandState` is the single contract between vision and audio, so the slider fallback and the webcam are interchangeable. The mapping is a pure, unit-tested function.

## Where it comes from

gibber-hands brings together three projects I wrote by hand, before I used AI coding assistants. The links below point to the last commit made before 2026, so they show that code as it was written.

| Project | When | What it was | What gibber-hands takes from it |
|---|---|---|---|
| [handMouse](https://github.com/CarloFanelli/handMouse/tree/d667b5863ca18107eab35afa51db1b4b3fa73ad4) | Mar–Oct 2025 | Python + OpenCV + MediaPipe prototype: move the mouse pointer with your index finger, click with a pinch | hand landmarks, pinch geometry, gesture gating, mirrored feedback |
| [drag-kit](https://github.com/CarloFanelli/drag-kit/tree/b1dec91c12dce37b53404d96cb7eb411d7518b9b) | May 2024 | Vanilla JS drag and drop without the HTML5 Drag and Drop API | dragging presets onto the instrument; hit-testing by geometry |
| [Resizer](https://github.com/CarloFanelli/Resizer/tree/41bb3caeb96e44f805aacd81c5baa9c37921ad70) | Jun 2024 | TypeScript side-by-side panels that you resize by dragging and that remember their sizes | the three panels: camera, instrument, live code |

## Creative front-end toolbox

The techniques I learned building those projects, and where gibber-hands uses them again.

### Hands as an input device (handMouse)

- **21 landmarks per hand, in normalized coordinates.** MediaPipe's Gesture Recognizer returns each point as x and y in 0..1 relative to the frame, plus a relative depth z. handMouse reads four of them: index tip (8), thumb tip (4), index base (5) and middle tip (12). See [`update_hand_points`](https://github.com/CarloFanelli/handMouse/blob/d667b5863ca18107eab35afa51db1b4b3fa73ad4/hand_recognition.py#L113-L137).
- **A pinch is a distance under a threshold.** The 3D distance between thumb tip and index tip below 0.06 counts as a pinch, and thumb to middle below 0.045 counts as a click. See [`checkPinch` and `click`](https://github.com/CarloFanelli/handMouse/blob/d667b5863ca18107eab35afa51db1b4b3fa73ad4/hand_recognition.py#L75-L101). Fixed thresholds only hold at one distance from the camera, because the hand gets smaller as it moves away. gibber-hands has to scale them by hand size.
- **A gesture as a mode switch.** Pointer movement and clicks are only evaluated while the recognizer says `Pointing_Up`. Any other hand shape is ignored, so the hand can rest without side effects. See [`isPointing` and the main loop](https://github.com/CarloFanelli/handMouse/blob/d667b5863ca18107eab35afa51db1b4b3fa73ad4/hand_recognition.py#L289-L295). In v1 the calls that actually move and click are commented out, so you can watch the detection without losing your mouse.
- **Mirrored feedback.** The frame is flipped for display ([`cv2.flip`](https://github.com/CarloFanelli/handMouse/blob/d667b5863ca18107eab35afa51db1b4b3fa73ad4/hand_recognition.py#L285)), so moving your hand right moves it right on screen. The x coordinates are flipped when they are read (`1 - x`). Keeping track of which coordinates are already flipped is the error-prone part, so in gibber-hands the rule is written down once, in the milestone 1 spec.
- **Show what the machine sees.** Landmarks, the line between the pinching fingers, a circle whose radius grows with the pinch distance, and the gesture name with its confidence are drawn over the video. See [`draw_circle_at_center`](https://github.com/CarloFanelli/handMouse/blob/d667b5863ca18107eab35afa51db1b4b3fa73ad4/hand_recognition.py#L105-L109). Without this feedback a gesture interface feels random.
- **A control area smaller than the frame.** handMouse draws a square on the feed ([`drawSquare`](https://github.com/CarloFanelli/handMouse/blob/d667b5863ca18107eab35afa51db1b4b3fa73ad4/hand_recognition.py#L218)) as the zone the hand should stay in. The idea is that small hand movements inside it cover the whole output range, so you don't need big arm movements. In v1 the square is only drawn, and the remapping is not implemented yet.

### Pointer interaction without browser events (drag-kit)

- **Drag with plain mouse events.** On `mousedown` the element becomes `position: absolute` and follows `mousemove` deltas in page coordinates. See [`dragedrop.js`](https://github.com/CarloFanelli/drag-kit/blob/b1dec91c12dce37b53404d96cb7eb411d7518b9b/assets/js/dragedrop/dragedrop.js#L47-L70).
- **Drop zones found by geometry, not by events.** On every move the pointer position is tested against each zone's rectangle, converted to page coordinates so scrolling doesn't break it. See [`detectDropZone` and `getCoords`](https://github.com/CarloFanelli/drag-kit/blob/b1dec91c12dce37b53404d96cb7eb411d7518b9b/assets/js/dragedrop/dragedrop.js#L80-L172). This matters here because a fingertip tracked by a camera fires no DOM events. Testing a point against rectangles is the only way a hand can "drop" something.
- **A placeholder while dragging.** A semi-transparent clone with configurable opacity is appended to the element's container and removed on release. See [`createClone`](https://github.com/CarloFanelli/drag-kit/blob/b1dec91c12dce37b53404d96cb7eb411d7518b9b/assets/js/dragedrop/elements/draggableElement.js#L19-L32).
- **Style every state with classes.** You pass the class lists for "dragging" and "over a zone", for both the element and the zones. On release over a zone a single `callback(dragElement, dropZone)` fires. See [`actionOnDrop`](https://github.com/CarloFanelli/drag-kit/blob/b1dec91c12dce37b53404d96cb7eb411d7518b9b/assets/js/dragedrop/dragedrop.js#L174-L197).

### Layout that remembers (Resizer)

- **Handles generated between panels.** A handle `div` is inserted after every panel except the last. See [`addResizer`](https://github.com/CarloFanelli/Resizer/blob/41bb3caeb96e44f805aacd81c5baa9c37921ad70/src/Resize.ts#L76-L88).
- **Resize from the start position, not step by step.** Each drag reads both neighbours' widths once on `mousedown`, then sets them to that width plus or minus the total mouse movement. Small errors therefore can't add up. See [`dragMouseDown` and `elementDrag`](https://github.com/CarloFanelli/Resizer/blob/41bb3caeb96e44f805aacd81c5baa9c37921ad70/src/Resize.ts#L105-L150).
- **Sizes saved as percentages.** On release each width is stored in `localStorage` as a percentage of the parent, and restored on load, so the layout survives a reload. See [`saveSize`](https://github.com/CarloFanelli/Resizer/blob/41bb3caeb96e44f805aacd81c5baa9c37921ad70/src/Resize.ts#L152-L174) and [`giveSize`](https://github.com/CarloFanelli/Resizer/blob/41bb3caeb96e44f805aacd81c5baa9c37921ad70/src/Resize.ts#L63-L74).
- **React to the DOM, not to calls.** A `MutationObserver` watches each panel's `class` attribute. When a panel gets the "hidden" class, the visible panels are resized again from the stored percentages, and the code that hid it doesn't need to know about the layout. See [`observeElementChanges`](https://github.com/CarloFanelli/Resizer/blob/41bb3caeb96e44f805aacd81c5baa9c37921ad70/src/Resize.ts#L37-L51).

## Built with an AI agent, on purpose

The three projects above were written by hand. gibber-hands is built with Claude Code, through a spec-first workflow: requirements interview, task breakdown, implementation one task at a time, review.

- [`CLAUDE.md`](CLAUDE.md) is the brief the agent works from.
- [`.ai/features/`](.ai/features/) holds the approved specs, the task files and the reviews.
- [`docs/PROCESS.md`](docs/PROCESS.md) is the log: what was asked, what the agent proposed, what was accepted or rejected, and why.

## Run locally

Requires Node 24.

```bash
git clone https://github.com/CarloFanelli/gibber-hands.git
cd gibber-hands
npm ci
npm run dev
```

`npm test` runs the mapping tests and `npm run typecheck` runs TypeScript. Every push to `main` runs the deploy workflow. The deploy succeeds once GitHub Pages is enabled with Source set to GitHub Actions (milestone 4).

## Stack

TypeScript 7 · Vite 8 · @mediapipe/tasks-vision 1.2 · gibber.audio.lib 2.1.4 · Vitest 5 · GitHub Actions + Pages
