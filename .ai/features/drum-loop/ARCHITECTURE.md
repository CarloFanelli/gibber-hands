---
feature: drum-loop
spec-version: 1.0
status: approved
---

# Architecture Plan: Drum loop

## Technical Approach

### Overview

The loop runs inside Gibber's audio worklet. A step function, sent there as source text like the voice graphs, triggers Gibberish's synthesized Kick, Snare and Hat on the worklet's per-sample scheduler. It applies a waiting drum pattern (with its tempo and the echo times) at a bar start, and waiting drum layers at a beat start, then reports what it applied. The page only sends wishes (playing, drum pattern, drum layers, muted) and shows what the worklet reports, so tracking jitter never touches timing. The rules (pattern data and step hits, pattern and layer bands, the second hand's three modes, the loop's state) are pure modules tested in Node; `main.ts` wires them. No new dependency: the kit uses Gibber's stock instruments, so the live code rebuilds it at gibber.cc.

### Shared Concerns

#### Wiring only in main

- **Appears in**: Task 01, Task 02, Task 03, Task 04, Task 05, Task 06
- **Reference example**: `src/main.ts:115-145`
- **Rule**: modules expose small interfaces and `main.ts` connects them; the loop's state (playing, drum pattern, drum layers, muted) lives there beside the second hand's mode.
- **Watch out for**: `startup.onHand` keeps one listener (`src/main.ts:243-250`); extend it.

#### Pure core, thin shell

- **Appears in**: Task 01, Task 02, Task 03, Task 04, Task 05, Task 06
- **Reference example**: `src/mapping/shape.ts` with `test/shape.test.ts`; `src/ui/statusLine.ts:25-27` with `test/statusLine.test.ts`
- **Rule**: every spec rule lives in a pure module tested in Node (`vite.config.ts:8`, environment `node`): mode switches, bands, loop state, step hits, panel words, snippet text.

#### Timing in the worklet

- **Appears in**: Task 01, Task 03, Task 04
- **Reference example**: `voiceGraph` sent as source (`src/synth/engine.ts:58-70`, `:204`); `eval` messages (`src/synth/engine.ts:341`, handled at `node_modules/gibberish-dsp/js/workletProcessor.js:255`); worklet-to-page reports via `Gibberish.utilities.workletHandlers` (`node_modules/gibberish-dsp/js/utilities.js:78-81`)
- **Rule**: hits, bar and beat boundaries, tempo and echo-time changes happen in the worklet; page messages only set the latest wish. Levels glide through `levelGraph` (`src/synth/engine.ts:76-80`).
- **Watch out for**: worklet code sees only worklet globals and ugens by id (`Gibberish.processor.ugens.get`), never page closures.

## Per-Task Technical Guidance

### Task 01: drum-loop-toggle

**Files to create:**
- `src/synth/drumPatterns.ts` — Rock (110 BPM, 16 steps, each hit tagged with its layer 1–4) and the pure step-hits rule; no Gibber import. Pattern: `src/synth/presets.ts`.
- `src/mapping/drumLoop.ts` — loop state: start (Rock, 4 drum layers on a first loop), stop, audio stop, engine failure.
- `src/ui/drumPanel.ts` — "Start drums"/"Stop drums" button and the "Drums: …" line. Pattern: `src/ui/audioPanel.ts:23-45`, words as `src/ui/statusLine.ts:25-43`.
- `test/drumPatterns.test.ts`, `test/drumLoop.test.ts`.

**Files to modify:**
- `src/synth/engine.ts` — a drums setter on `SynthEngine` (`:26-37`); boot builds the kit, a drum bus Level and the worklet step loop; `start()`/`stop()` (`:114-153`) restart or ramp it; replay the drum wish at boot (`:137-141`).
- `src/synth/presets.ts:119-125` — `delaySamples` takes the tempo; 140 when the loop is stopped.
- `src/synth/gibber.d.ts` — declare `instruments` and `utilities.workletHandlers`.
- `src/ui/shortcuts.ts:7,23-30` and its test — a drums action on D.
- `src/main.ts`, `src/ui/styles.css`.

**Key decisions:**
- Gibberish's synthesized kit (`node_modules/gibberish-dsp/js/instruments/instruments.js:4-10`), not Gibber's `Drums`, which loads `.wav` files (`node_modules/gibber.audio.lib/js/drums.js:71-74`).
- The scheduler ticks per sample (`workletProcessor.js:291`) and carries fractional samples (`scheduling/sequencer.js`, `floatError`): no drift.

**Watch out for:**
- Echo time jumps and clicks: Delay reads `time` as a plain input (`node_modules/gibberish-dsp/js/fx/delay.js:22`) → feed it a gliding Level per delay preset (`src/synth/engine.ts:325`); test: Organ echoing while the loop starts and stops.
- A failed engine leaves the panel saying "Drums: Rock" over silence (`src/synth/engine.ts:143-146`) → drumLoop stops the loop on failure; test: failure → "Drums off".
- Drum hits push the sum past −3 dBFS: the limiter is set for one hand (`src/synth/engine.ts:43-45`) → measure the drum bus gain at 4 layers plus two hands; test: peak measurement as for preset gains.

---

### Task 02: drum-mode-switch

**Files to modify:**
- `src/mapping/shape.ts:15-29` — `mode` gains `'drums'`. `followSecondHand`: Victory toggles notes and shape mode and takes drum mode to shape; the rock sign toggles notes and drum mode and takes shape mode to drums; once per sign through `lastGesture`.
- `src/mapping/shape.ts:57-60` — `asPlayed` plays drum mode as a lost hand too.
- `test/shape.test.ts` — the transition table, held and short signs, swap.
- `src/main.ts:119-125` — entering drum mode starts a stopped loop (drumLoop); "Stop drums" sets the mode back to notes.
- `src/ui/overlay.ts:22` — `MODE_WORDS` gains drums, icon 🤟.

**Patterns to reuse:**
- The `modes()` helper in `test/shape.test.ts`.

**Key decisions:**
- The rock sign is MediaPipe's `ILoveYou` (`src/hands/types.ts:8`); the debounce (`src/hands/gesture.ts:8-9`) is the confirmation time.
- `shape.ts` stays free of loop state: main starts the loop on the mode change.
- `octaveShift` and `effectAmount` already give 0 and the preset's amount outside shape mode (`src/mapping/shape.ts:38-55`).

**Watch out for:**
- `asPlayed` tests `=== 'shape'` (`src/mapping/shape.ts:58-59`): drum mode would still play notes → treat every non-notes mode as lost; test: drum mode maps to a silent hand.
- "Stop drums" re-enters drum mode at once if the reset clears `lastGesture` while the sign is held → keep it; test: Stop drums during a held rock sign stays in notes.

---

### Task 03: pattern-and-layers

**Files to modify:**
- `src/synth/drumPatterns.ts` — House 124, Hip-hop 90, Breakbeat 130; the bar and beat rule that applies a waiting change; hits tuned by ear.
- `src/mapping/handToSynth.ts:86-100` — export the band-with-hysteresis rule `noteLane` uses, so patterns (four across) and drum layers (four up, via `zoneHeight`, `:107`) reuse its 20%.
- `src/mapping/drumLoop.ts` — the drum pattern and drum layers under the second hand; the last ones kept for the next start.
- `src/synth/engine.ts` — the step loop applies the waiting pattern, its tempo and the echo times at step 0, layers at each beat, and reports both.
- `src/main.ts`, `src/ui/drumPanel.ts` — send the choice in drum mode; show the reported pattern and tempo.
- `src/ui/overlay.ts:74-95,213-230` — a drum label, "Rock 3/4", built with `showWords` (`:265`).
- Tests: `test/drumPatterns.test.ts`, `test/drumLoop.test.ts`, `test/mapping.test.ts`.

**Key decisions:**
- The worklet reports what it applied; the page never computes the bar.
- Echo times change inside the step loop, so they land on the bar.

**Watch out for:**
- Exporting the band rule changes note lanes if its edge rounding moves (`src/mapping/handToSynth.ts:93-98`) → keep `noteLane`'s behavior; test: existing `test/mapping.test.ts` lane cases pass unchanged.
- Two wishes within one bar must leave only the latest waiting → the waiting slot is overwritten, never queued; test: Rock → House → Hip-hop within a bar applies Hip-hop.

---

### Task 04: fist-mutes-drums

**Files to modify:**
- `src/mapping/drumLoop.ts` — muted while the second hand, present and in drum mode, shows a closed fist; the mute ends when the hand leaves, the mode changes, audio stops or the loop stops.
- `src/synth/engine.ts` — mute glides the drum bus Level to 0 and back; the step loop keeps running, so the drums return in time.
- `src/ui/drumPanel.ts` — "· muted".
- `src/main.ts` — an engine status other than on ends the mute.
- `test/drumLoop.test.ts`.

**Patterns to reuse:**
- The fist's 30 ms ramp (`RAMP_MS`, `src/mapping/handToSynth.ts:28`) as the mute glide.

**Watch out for:**
- "Stop audio" ramps the drum bus down (Task 01); "Start audio" must bring it back unmuted (`src/synth/engine.ts:114-120`) → the replayed wish carries `muted: false`; test: mute, Stop audio, Start audio → drums heard.

---

### Task 05: drum-live-code

**Files to modify:**
- `src/synth/snippet.ts:25-30` — `gibberSnippet` takes the loop heard: tempo, drums, or null. While it plays it starts with `Clock.bpm = …`; unmuted, one stock instrument per layer playing follows, each sequenced on sixteenths; `STOCK_NAMES` (`:18`) gains them.
- `src/synth/drumPatterns.ts` — the snippet reads the same step data and kit settings as the engine.
- `src/main.ts:94-97` — `showCode` passes the reported loop: tempo only while muted, null when stopped.
- `test/snippet.test.ts` — Hip-hop at 2 layers; stopped; muted keeps the tempo line.

**Patterns to reuse:**
- `voiceCode` and `settings()` (`src/synth/snippet.ts:32-69`).

**Key decisions:**
- Each instrument's `trigger.seq` (`node_modules/gibber.audio.lib/js/instruments.js:252-293`) over `EDrums`, whose score strings are commented out in this version (`node_modules/gibber.audio.lib/js/drums.js:154-164`).

**Watch out for:**
- Pasted drums sound different: Gibber's stock defaults (`node_modules/gibberish-dsp/js/instruments/kick.js:38-45`) aren't the engine's kit → print every kit setting from the shared constant; test: snippet settings equal the kit's.
- gibber.cc runs its own Gibber build; the paste check stays manual, as for the voices.

---

### Task 06: slider-drum-controls

**Files to modify:**
- `src/ui/sliders.ts:113-131` — a drum pattern radio group in a fieldset, as the Octave choice, and a 1–4 drum layers range; both call a drums callback.
- `src/main.ts:82` — pass that callback; the sliders' choice goes where the hand's would.
- `src/ui/styles.css`, `test/sliders.test.ts`.

**Key decisions:**
- The sliders set the drum pattern and drum layers directly: their second hand stays in shape mode (`src/ui/sliders.ts:40`), so drum mode isn't needed.

---

### Task 07: drum-guidance

**Files to modify:**
- `src/ui/gestureGuide.ts:16-30` — rows for the second hand's rock sign and drum mode's left–right, up–down and closed fist.
- `src/ui/helpSheet.ts:28-60` — the same rows under "With two hands", <kbd>D</kbd> under Keys, "Start drums / Stop drums" under Mouse and touch, the sliders' pattern and layers.

**Patterns to reuse:**
- `data-hand="second"` spans named by `nameHands` (`src/ui/handWords.ts`), which already follow the swap.
