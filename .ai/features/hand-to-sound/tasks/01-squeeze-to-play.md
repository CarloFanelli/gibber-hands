# Task 01: squeeze-to-play

## Objective

The visitor clicks "Start audio" and plays by squeezing thumb and index: the closer the fingers, the louder the sound, while a closed fist or a lost hand silences it. "Stop audio" silences everything, and a failed engine start is named with Try again.

## Context

**Satisfies**: REQ-1, REQ-2, REQ-3, REQ-10, REQ-11, REQ-12, REQ-13, REQ-14

This is the first sound the instrument makes. Starting, stopping and the volume rules ship together, because none of them can be heard without the others. The note and the brightness stay at fixed starting values until task 02. The tracker's 150 ms hold and 100 ms gesture debounce already shape what reaches the sound.

## Depends on

None

## Expected Behavior

- Nothing plays when the page opens. The instrument panel shows a "Start audio" button.
- The first click starts the audio engine. The button then reads "Stop audio".
- "Stop audio" fades everything to silence. Clicking again resumes the sound at the volume the hand currently asks for.
- The sound is a sawtooth synth, then a resonant low-pass filter, then a reverb with a fixed 30% mix.
- Pinch at or below 0.2 gives full volume and pinch at or above 0.5 gives silence. In between, volume grows with the square of how far the fingers have closed.
- Volume changes ramp over 15 ms. Squeezing fully in 0.2 s produces no audible click or zipper noise, checked by ear and on a spectrogram of a recording.
- A closed fist fades to silence within 30 ms whatever the pinch. Leaving the fist brings back the pinch volume.
- When the hand is lost, the sound fades to silence over 100 ms.
- If the engine can't start, the instrument panel names the reason. It offers Try again when retrying can help. Tracking keeps working either way.
- At full volume the sound peaks at or below −3 dBFS.
- Sound works in current desktop Chrome, Edge, Firefox and Safari. With audio on, tracking still reaches 25 fps on both reference laptops.
- Gibber's features that load code from the network are never called.

## Acceptance Criteria

- [ ] No sound plays before "Start audio" is clicked; the click starts the engine once, even when double-clicked (REQ-1)
- [ ] "Stop audio" fades to silence within 30 ms; clicking again resumes at the current pinch volume (REQ-2)
- [ ] A failed engine start shows its reason in the instrument panel, with Try again when retrying can help (REQ-3)
- [ ] The sound is sawtooth into resonant low-pass into a 30% reverb, peaking at or below −3 dBFS (REQ-14)
- [ ] Pinch 0.2 or less is full volume, 0.5 or more is silence, and 0.35 gives 25% amplitude (REQ-10, REQ-11)
- [ ] A closed fist silences within 30 ms whatever the pinch; leaving it restores the pinch volume (REQ-12)
- [ ] Losing the hand fades the sound to silence over 100 ms, without a click (REQ-13)

## Edge Cases

- Until milestone 3 → the instrument panel shows no preset buttons, only "Start audio" and its status (REQ-1 · from code)
- Hand moves before "Start audio" → no sound (REQ-1)
- "Start audio" clicked twice quickly → the engine starts once (REQ-1)
- Audio started with no hand in view → silence until a hand squeezes (REQ-1)
- "Stop audio" while playing → the sound fades out within 30 ms, no click (REQ-2)
- Audio resumed while the hand is squeezing → the sound fades in to the current volume within 30 ms (REQ-2)
- Sound worklet file fails to download → "Audio engine couldn't load: network" with Try again; tracking keeps working (REQ-3)
- Browser without audio worklet support → "This browser can't run the audio engine"; no Try again; tracking keeps working (REQ-3)
- Try again clicked repeatedly → one attempt at a time; the button is disabled until it settles (REQ-3)
- Pinch exactly 0.2 → full volume (REQ-10)
- Pinch exactly 0.5 → silence (REQ-10)
- Pinch held by the tracker (hand edge-on) → volume keeps its last value (REQ-10)
- Pinch 0.35 (halfway) → 25% of full amplitude (REQ-11)
- Pinch jumps from fully open to touching in one frame → volume ramps over 15 ms, no click (REQ-11)
- Fist recognized while squeezing → silence within 30 ms (REQ-12)
- Fist confidence flickering around 0.6 → no stutter: the tracker's 100 ms gesture debounce applies (REQ-12)
- Slider gesture menu set to "Closed fist" → silence, as with the camera (REQ-17, REQ-12)
- Hand lost at full volume → fades over 100 ms, no click (REQ-13)
- Hand back within 150 ms → no fade: the tracker still reports the hand present (REQ-13)
- Hand lost while audio is stopped → nothing happens (REQ-13)
