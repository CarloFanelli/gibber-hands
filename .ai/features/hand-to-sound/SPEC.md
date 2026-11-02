---
feature: hand-to-sound
version: 1.0
status: approved
completed: false
---

# Hand to Sound

## Overview

The hand now plays sound. A click on "Start audio" starts the engine, because browsers don't allow sound before a click. The **palm center** picks one of 8 notes of A minor pentatonic. The notes are laid out as **note lanes** across the **playing zone** and drawn on the overlay, and palm height sets the brightness. Squeezing thumb and index sets the volume: fingers touching give full volume and fingers apart give silence, so a relaxed hand is quiet. A closed fist silences the sound. Notes slide into each other, and every change is ramped so nothing crackles. Next to the video, a Gibber snippet shows the current sound, and it runs unchanged at gibber.cc. The slider fallback plays exactly the same way.

## Project Context

- The mapping from HandState to sound settings is a pure, unit-tested function. Behaviour changes start there.
- The audio engine is the only module that uses Gibber.
- Audio starts only after a click. The camera has already started on page load (hand-tracking spec).
- Gibber 2.1.4 has had no release since 2022, and its sound worklet file must be served next to the page.
- One hand and one sound: presets arrive in milestone 3.
- Pinch levels, lane hysteresis and ramp times are starting values tuned by ear. Each change gets a test and a PROCESS.md entry.

## Functional Requirements

### Starting audio

- REQ-1: No sound plays until the visitor clicks "Start audio"; that click starts the audio engine.
- REQ-2: After starting, the button becomes "Stop audio": it silences everything, and clicking again resumes the sound.
- REQ-3: If the audio engine fails to start, the instrument panel shows the reason and a "Try again" button.

### Pitch

- REQ-4: The central 80% of the view's width holds 8 equal note lanes; a palm beyond either side plays the nearest outer lane.
- REQ-5: From left to right the lanes play A minor pentatonic: A3, C4, D4, E4, G4, A4, C5, D5.
- REQ-6: The note changes only after the palm center passes a lane border by more than 20% of a lane's width.
- REQ-7: When the note changes while sound is playing, the pitch slides to the new note in 40 ms without restarting the sound.
- REQ-8: The overlay draws the 8 lanes with their note names and highlights the lane being played.

### Brightness

- REQ-9: Palm height sets the filter cutoff exponentially across the central 80% of the view height: 200 Hz at its bottom, 6.4 kHz at its top.

### Volume and silence

- REQ-10: Pinch at or below 0.2 gives full volume; at or above 0.5, silence.
- REQ-11: Between pinch 0.5 and 0.2, volume grows with the square of how far the fingers have closed, so it fades in gently.
- REQ-12: A closed fist fades the sound to silence within 30 ms whatever the pinch; leaving the fist restores the pinch volume.
- REQ-13: When the hand is lost, the sound fades to silence over 100 ms.

### Sound

- REQ-14: The sound is a sawtooth synth, then a resonant low-pass filter, then a reverb with a fixed 30% mix.

### Live code

- REQ-15: The live code panel shows a Gibber snippet for the current sound, note, brightness and volume, updated at most 10 times per second.
- REQ-16: Pasted unchanged into the gibber.cc playground, the snippet plays the same sound at the same note, brightness and volume.

### Fallback

- REQ-17: HandState from the slider fallback produces exactly the same sound behavior as HandState from the camera.

## Data & Dependencies

### Information the feature must retain

- Current note lane — remembered between frames for the hysteresis, and forgotten when the hand is lost.
- Audio on/off — off until the first click, then toggled by the button. Not persisted.

### External capabilities relied on

- Sound synthesis in the browser — Gibber, running in an audio worklet.
- An audio output device on the visitor's machine.

## Non-Functional Requirements

- **Performance** — Volume and brightness changes ramp over 15 ms and note slides take 40 ms. The sound therefore never trails tracking by more than 40 ms.
- **Performance** — Sweeping the palm across the full height in 0.5 s, or squeezing fully in 0.2 s, produces no audible clicks or zipper noise. This is checked by ear and on a spectrogram of a recording.
- **Performance** — With audio on, tracking still meets the 25 fps target on both reference laptops.
- **Validation** — At full volume the default sound peaks at or below −3 dBFS (3 dB under the loudest level the output can produce).
- **Validation** — The mapping is unit-tested, including slider-shaped states. The tests cover lanes, hysteresis, the cutoff curve, the volume curve, the fist and hand loss.
- **Validation** — Sound works in current desktop Chrome, Edge, Firefox and Safari.
- **Security** — Nothing plays before a click, and Gibber's features that load code from the network are never called.

## Edge Cases & Error Handling

| Edge Case | Expected Behavior | Relates to |
|-----------|-------------------|------------|
| Hand moves before "Start audio" | No sound; lanes and snippet still update | REQ-1, REQ-15 |
| "Start audio" clicked twice quickly | Engine starts once | REQ-1 |
| Audio started with no hand in view | Silence until a hand squeezes | REQ-1 |
| "Stop audio" while playing | Sound fades out within 30 ms, no click | REQ-2 |
| Audio resumed while the hand is squeezing | Sound fades in to the current volume within 30 ms | REQ-2 |
| Sound worklet file fails to download | "Audio engine couldn't load: network" with Try again; tracking keeps working | REQ-3 |
| Browser without audio worklet support | "This browser can't run the audio engine"; no Try again; tracking keeps working | REQ-3 |
| Try again clicked repeatedly | One attempt at a time; button disabled until it settles | REQ-3 |
| Palm left of the central zone | Lane 1 (A3) | REQ-4 |
| Palm exactly on a lane border when sound starts | The lane to the right of the border | REQ-4 |
| Hand lost, then found again | Previous lane forgotten; the lane under the palm is used, no hysteresis | REQ-4, REQ-6 |
| Outer lanes | Lane 1 = A3 (220 Hz), lane 8 = D5 (587.33 Hz) | REQ-5 |
| Tuning | Equal temperament, A4 = 440 Hz | REQ-5 |
| Palm wobbling ±1% of view width around a border | Note doesn't change | REQ-6 |
| Palm crosses two lanes in one frame | Goes straight to the new lane, no notes in between | REQ-6 |
| Note changes while silent (fingers apart) | Pitch jumps at once; the next squeeze starts on the new note | REQ-7 |
| Several note changes within 40 ms | The slide heads to the latest note | REQ-7 |
| Slider fallback active | No lanes; the horizontal slider shows the current note name | REQ-8, REQ-17 |
| No hand in view | Lanes drawn, none highlighted | REQ-8 |
| Camera panel narrower than 320 px | Lanes drawn without note names | REQ-8 |
| Palm above the central zone | 6.4 kHz | REQ-9 |
| Palm below the central zone | 200 Hz | REQ-9 |
| Hand lost | Cutoff stays where it was while the sound fades | REQ-9, REQ-13 |
| Pinch exactly 0.2 | Full volume | REQ-10 |
| Pinch exactly 0.5 | Silence | REQ-10 |
| Pinch held by the tracker (hand edge-on) | Volume keeps its last value | REQ-10 |
| Pinch 0.35 (halfway) | 25% of full amplitude | REQ-11 |
| Pinch jumps from fully open to touching in one frame | Volume ramps over 15 ms, no click | REQ-11 |
| Fist recognized while squeezing | Silence within 30 ms | REQ-12 |
| Fist confidence flickering around 0.6 | No stutter: the tracker's 100 ms gesture debounce applies | REQ-12 |
| Hand lost at full volume | Fades over 100 ms, no click | REQ-13 |
| Hand back within 150 ms | No fade: the tracker still reports the hand present | REQ-13 |
| Hand lost while audio is stopped | Nothing happens | REQ-13 |
| Lowest note with the darkest cutoff | Still audible (the cutoff stays above the note) | REQ-14 |
| Highest cutoff with resonance at full volume | Peak stays at or below −3 dBFS, no self-oscillation | REQ-14 |
| Snippet before "Start audio" | Shown and updating | REQ-15 |
| Hand moving fast | Panel updates at most 10 times per second and shows the latest state within 100 ms | REQ-15 |
| Snippet copied while silent | Plays silence; a comment line in the snippet says how to raise the volume | REQ-16 |
| Snippet uses functions missing from the playground's Gibber | Must not happen; review pastes the snippet into gibber.cc to check | REQ-16 |
| N/A — network: the app never contacts gibber.cc; the snippet is plain text | — | REQ-16 |
| Slider gesture menu set to "Closed fist" | Silence, as with the camera | REQ-17, REQ-12 |
| Horizontal slider at 0 or 1 | Lane 1 or lane 8 | REQ-17, REQ-4 |

## Out of Scope

- **Hold or drone** — dropped for now: an open, relaxed hand is the resting shape and would freeze notes without meaning to.
- **Hand control of the effect amount** — a second pinch moves while squeezing, so the effect is fixed per sound.
- **Presets and switching sounds** — milestone 3; this milestone has one sound.
- **Choosing the scale or root note** — milestone 3 presets carry their own scale.
- **Recording or exporting audio** — not part of the play loop.
- **MIDI output** — not requested, and it would add a second output path to maintain.
- **Editing the snippet to change the sound** — the panel is read-only; live-coding in the page is a separate feature.
- **Phone audio quirks, such as the iPhone silent switch muting web audio** — phones have no targets in this project.
- **Final look of the Start button and the code panel** — milestone 3.
