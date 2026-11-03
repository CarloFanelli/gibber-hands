---
feature: hand-to-sound
spec-version: 1.0
status: approved
---

# Architecture Plan: Hand to Sound

## Technical Approach

### Overview

`src/synth/engine.ts` stays the only file that imports Gibber.

It loads the prebuilt bundle `gibber.audio.lib/dist/gibber.audio.js` together with the worklet from the same `dist/` folder. The package's `main` field (`node_modules/gibber.audio.lib/package.json:33`) points to the bare audio plugin, which has no `Gibber.init`. The init the README documents lives in `js/index.js:8` and in the bundle.

Gibber applies every property change as an instant jump in the audio thread (`node_modules/gibberish-dsp/js/workletProcessor.js:167-176`). So the engine registers one custom instrument whose pitch, cutoff and volume pass through per-sample slides inside the worklet. The stock Synth already does this for pitch (`node_modules/gibberish-dsp/js/instruments/synth.dsp.js:13-14`). The instrument is registered the way Gibber's own `Make` does it (`node_modules/gibber.audio.lib/js/make.js:3-31`) and is followed by Gibber's `Reverb`.

`src/mapping/handToSynth.ts` stays pure: it turns a HandState, plus the previous note lane, into target values in physical units.

No new dependency.

### Shared Concerns

#### Pure core, thin shell

- **Appears in**: Task 01, Task 02, Task 03
- **Reference example**: `src/hands/gesture.ts` with `test/gesture.test.ts`; `src/hands/modelSource.ts` beside `src/hands/model.ts`
- **Rule**: every number in the spec lives in a pure module tested in Node. Only `engine.ts` and `src/ui/` touch Gibber or the DOM.
- **Watch out for**: the Gibber bundle runs browser code as soon as it is imported. A module the tests import must never import `engine.ts`.

#### One HandState listener in main

- **Appears in**: Task 01, Task 02, Task 03
- **Reference example**: `src/main.ts:28-32`
- **Rule**: `main.ts` registers a single hand listener that feeds the overlay, the mapping, the engine and the live code. Any state carried between frames, like the previous note lane, lives there.
- **Watch out for**: `onHand` keeps only the last callback (`src/hands/startup.ts:118-120`). A second call silently disconnects the overlay.

## Per-Task Technical Guidance

### Task 01: squeeze-to-play

**Files to modify:**
- `src/mapping/handToSynth.ts`, `test/mapping.test.ts`:
  - SynthParams becomes physical targets: frequency and cutoff in Hz, curved amplitude, and the fade (pinch 15 ms, fist 30 ms, lost 100 ms).
  - Drop `hold`, `fx`, `mute`; note and cutoff stay fixed until Task 02.
- `src/synth/engine.ts`: Gibber starts on the first Start click; one custom slid instrument plus `Reverb` at 30%; start, stop/resume, update, failure reasons; drops `applyPreset` and the unused `currentCode`.
- `src/main.ts`: Start/Stop wiring and the single hand listener.
- `src/ui/layout.ts`: instrument-panel status slot.
- Remove the preset buttons (`src/main.ts:34-36`, `src/synth/presets.ts`, `presets` in `src/ui/layout.ts`). Presets arrive in milestone 3.

**Files to create:**
- `src/ui/audioPanel.ts`: the Start/Stop button, the failure text and Try again. Follows `src/ui/cameraPanel.ts`.
- `src/ui/statusCard.ts`: the card moved out of `src/ui/cameraPanel.ts:71-86`, so both panels share it.
- `src/synth/engineFailure.ts` and its test: classifies failures as unsupported or network, like `src/hands/modelSource.ts`.

**Key decisions:**
- Each slide's length comes from its 1% settling time: one-pole slides never land.
- "Unsupported" means no `AudioContext` or `AudioWorkletNode`, as the spec says. Gibberish would otherwise fall back to a ScriptProcessor (`gibber.audio.js:1465`).
- First step: a browser spike proving init, the custom instrument and click-free volume steps; if it fails, stop and ask.

**Watch out for:**
- One click never starts audio: Gibberish creates its context only on a later mousedown, keydown or touchstart — `gibber.audio.js:25265-25272` → dispatch that event on `window` right after init; test: one click, mouse and keyboard, touch-screen laptop.
- A worklet that fails to load hangs init forever, because the failure is never caught — `gibber.audio.js:25282` → fetch the worklet file first and add a timeout; test: block the file in DevTools, the panel shows the network reason.
- Init allocates a 20-minute 64-bit buffer, about 423 MB — `gibber.audio.js:4863`, `20563` → measure memory and fps after Start on both laptops; test: manual, 25 fps or more with audio on.

---

### Task 02: note-lanes-and-brightness

**Files to modify:**
- `src/mapping/handToSynth.ts`, `test/mapping.test.ts`:
  - Note lanes across the playing zone, with 20% hysteresis from the previous note lane (none after the hand is lost).
  - Equal-temperament frequencies from A4 = 440 Hz.
  - Exponential cutoff from 200 Hz to 6.4 kHz.
  - Tests include slider-shaped states.
- `src/synth/engine.ts`: pitch slides over 40 ms while sounding and jumps at once when silent.
- `src/main.ts`: keeps the previous note lane and clears it when presence is false. Passes the lane to the overlay and the note name to the sliders. To do that, it keeps the instance its fallback factory returns (`src/main.ts:25`).
- `src/ui/overlay.ts`: draws the lanes in the same letterboxed rectangle as the landmarks (`src/ui/overlay.ts:47`), with no second mirroring. Highlights the played lane and hides names below 320 px.
- `src/ui/sliders.ts`: a note-name readout beside the left–right slider.

**Key decisions:**
- The playing zone and lane constants are exported once from the mapping and drawn by the overlay, so what is drawn and what is played can't disagree.

**Watch out for:**
- With no hand, nothing is drawn, so the lanes would vanish: `render` returns early without a hand — `src/ui/overlay.ts:59` → draw the lanes before that guard; test: manual, no hand gives lanes with none highlighted.
- A note name recomputed inside the sliders would ignore the hysteresis, since slider steps (0.01) are finer than the hysteresis (0.02) — `src/ui/sliders.ts:49` → show the name the mapping returns; test: mapping test on slider-shaped states.

---

### Task 03: live-code-snippet

**Files to create:**
- `src/synth/snippet.ts`, `test/snippet.test.ts`:
  - pure: mapping output to Gibber code;
  - stock calls only (a sawtooth Synth with the Moog-model filter, Q, cutoff and gain, plus `Reverb` at 30%);
  - converts Hz into Gibber's units;
  - adds a comment line when silent.

**Files to modify:**
- `src/main.ts`: updates the snippet at most 10 times per second, ending on the latest state, through `layout.liveCode.show` (`src/ui/layout.ts:55`). The snippet comes from the mapping, so it works before Start.

**Key decisions:**
- The engine's custom instrument uses the same Gibberish oscillator and filter model as the stock Synth (`synth.dsp.js:24`, `41`). So the snippet sounds the same at rest.

**Watch out for:**
- A throttle that drops the last update leaves a stale snippet after the hand stops — `src/main.ts` → keep a trailing update; test: unit test with fake timers.
- gibber.cc may run a newer Gibber than 2.1.4 — `src/synth/snippet.ts` → paste every snippet shape into gibber.cc during review; test: manual paste, silent and loud.
