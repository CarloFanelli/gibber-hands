# Task 04: pinch-and-gestures

## Objective

HandState carries two pinch values that don't depend on the distance from the camera, and a steady gesture. The overlay names the gesture with its confidence, e.g. "Pointing up · 87%".

## Context

**Satisfies**: REQ-9, REQ-10, REQ-11, REQ-14

In milestone 2 the pinch drives the volume and a closed fist mutes, so both must be stable before any sound depends on them. Dividing by hand size fixes handMouse's fixed thresholds, which only held at one distance from the camera.

## Depends on

- Task 03

## Expected Behavior

- Pinch is the thumb-to-index fingertip distance divided by hand size, clamped to 0..1, where 0 means touching. Middle pinch uses the middle fingertip instead of the index.
- For the same hand shape, pinch differs by ≤ 15% between 40 cm and 80 cm from the camera.
- The gesture is one of the seven named gestures (closed fist, open palm, pointing up, thumb down, thumb up, victory, I love you) or none, with its confidence from 0 to 1.
- A new gesture replaces the current one only after it has been reported with confidence ≥ 0.6 for at least 100 ms.
- The overlay shows the gesture name and its rounded confidence ("Pointing up · 87%"), or "No gesture" when a hand is present without one.
- When presence turns false, the gesture becomes none.

## Acceptance Criteria

- [ ] Thumb and index touching gives a pinch near 0; fingers spread gives a pinch of 1 (REQ-9)
- [ ] Middle pinch behaves the same way with the thumb and the middle fingertip (REQ-9)
- [ ] The same pinch shape at 40 cm and at 80 cm from the camera gives values within 15% of each other (REQ-9)
- [ ] Each of the seven gestures shows its name and confidence on the overlay, e.g. "Pointing up · 87%" (REQ-10, REQ-14)
- [ ] A new gesture shows only after ≥ 0.6 confidence for 100 ms; brief flickers don't change the label (REQ-11)
- [ ] A hand with no named gesture shows "No gesture" (REQ-10, REQ-14)

## Edge Cases

- Fingers spread wide → pinch = 1 (clamped) (REQ-9)
- Hand edge-on to the camera, hand size below 2% of frame width → pinch values held from the previous frame (REQ-9)
- Hand present, no named gesture → gesture none; the overlay shows "No gesture" (REQ-10, REQ-14)
- Unknown gesture label from the model → treated as none (REQ-10)
- New gesture at confidence 0.59 → ignored (REQ-11)
- Two gestures alternating every 50 ms → the current gesture is kept (REQ-11)
- Hand lost for 150 ms → the gesture becomes none (REQ-7, REQ-11)
- Confidence rounds up to 100 → shows "100%" (REQ-14)

## Notes from implementation

- **Known limitation**: the 40 cm / 80 cm check was approximated by running the real model on four hand photos drawn at full and half size. Thumb-to-index pinch stayed within 3–5%, but middle pinch on the pointing-up photo moved 20% (0.30 to 0.24), from landmark noise on the smaller hand, not from the formula (scale-invariant in the unit tests). Middle pinch at 80 cm still needs a check with a real hand before milestone 2 relies on it. /dev, 2026-11-02.
