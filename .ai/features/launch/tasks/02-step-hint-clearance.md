# Task 02: step-hint-clearance

## Objective

While a step hint shows over the camera view, the camera's status cards and the sliders sit below it, and scroll there when they don't fit. "Start audio" no longer covers "Camera access blocked" or its Try again button.

## Context

**Satisfies**: REQ-17

Carlo saw the overlap at 1536 px wide with the camera blocked. The step hint keeps a fixed place near the top of the camera view, while the cards and the sliders are centred in it. So any camera view too short for them slides them under the step hint, not only on phones. This absorbs backlog item B-12.

## Depends on

None

## Expected Behavior

- With a step hint shown, the status cards and the sliders start below its lower edge, and scroll in the space below it when they don't fit.
- The step hint keeps its place: under the top labels, and lower when the second hand's label shows.
- With no step hint shown, the cards and the sliders are centred in the full camera view, as today.
- The rule holds for every card: camera blocked, no camera, camera in use, camera disconnected, and the hand model's cards.

## Acceptance Criteria

- [ ] At 1536 px wide with the camera blocked, "Start audio" covers no part of the "Camera access blocked" card, its Try again button or the sliders (REQ-17)
- [ ] In every window from 320×480 px up, no step hint overlaps a status card or the sliders (REQ-17)
- [ ] When the cards and sliders don't fit below the step hint, they scroll there and every control stays reachable (REQ-17)
- [ ] With no step hint shown, the cards and sliders are centred in the full camera view, as before (REQ-17)

## Edge Cases

- Card and sliders taller than the room under the step hint (camera blocked, 1536 px wide) → they start below the step hint and scroll there; the step hint stays where it is (REQ-17)
- No step hint shown (steps done, or hints stopped after the first sound) → card and sliders use the camera view's full height, centred as today (REQ-17)
- The second hand's label pushes the step hint lower → card and sliders start below the step hint's new place (REQ-17)
- The step changes while a card is shown (e.g. "Start audio" to the squeeze step) → no overlap at any step (REQ-17)
- Hand model card shown with the camera card (e.g. no network) → both cards and the sliders start below the step hint (REQ-17)
- A panel resized, or the window crossing into stacked panels, while a card is shown → no overlap after the change (REQ-17)
- Window under 320×480 px → outside this guarantee; card and sliders still scroll (REQ-17)

## Notes from implementation

- **Known limitation**: at 320×480 the stacked camera panel leaves a strip about 53 px tall under the step hint, and about 21 px when the right hand's labels push the hint lower. Nothing is covered, and every card and control can be scrolled into the strip, but a two-line message shows only about 40% at a time in the lower case, and the "Video stays on your device" note sits over the strip's bottom (backlog B-10). The spec puts phones outside its targets and keeps the step hint in place. Measured in headless Chromium with the camera blocked: at 1536×730, 1280×720, 1920×1080, 720×480 and 375×667, nothing is covered and every control is fully visible at some scroll position. /dev, 2026-11-06.
