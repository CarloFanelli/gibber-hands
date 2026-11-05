---
feature: drum-loop
spec-version: 2.0
status: approved
---

# Architecture Plan: Drum loop

## Technical Approach

### Overview

The loop runs inside Gibber's audio worklet. A step function, sent there as source text like the voice graphs, triggers Gibberish's synthesized Kick, Snare and Hat on the worklet's per-sample scheduler. It applies a waiting drum pattern (with its tempo and the echo times) at a bar start, and waiting drum layers at a beat start, then reports what it applied. The page only sends wishes (playing, drum pattern, drum layers) and shows what the worklet reports, so tracking jitter never touches timing. The rules (pattern data and step hits, the loop's state and its button steps, the panel's words) are pure modules tested in Node; `main.ts` wires them. Spec 2.0 dropped drum mode: the panel's buttons choose the beat, and no gesture reaches the loop. No new dependency: the kit uses Gibber's stock instruments, so the live code rebuilds it at gibber.cc.

### Shared Concerns

#### Wiring only in main

- **Appears in**: Task 01, Task 03, Task 05, Task 06
- **Reference example**: `src/main.ts:115-145`
- **Rule**: modules expose small interfaces and `main.ts` connects them; the loop's state (playing, drum pattern, drum layers) lives there.
- **Watch out for**: `startup.onHand` keeps one listener (`src/main.ts:243-250`); extend it.

#### Pure core, thin shell

- **Appears in**: Task 01, Task 03, Task 05, Task 06
- **Reference example**: `src/mapping/shape.ts` with `test/shape.test.ts`; `src/ui/statusLine.ts:25-27` with `test/statusLine.test.ts`
- **Rule**: every spec rule lives in a pure module tested in Node (`vite.config.ts:8`, environment `node`): loop state and button steps, step hits, panel words and which buttons are disabled, snippet text.

#### Timing in the worklet

- **Appears in**: Task 01, Task 03
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

### Task 03: pattern-and-layers

**Files to modify:**
- `src/synth/drumPatterns.ts` — House 124, Hip-hop 90, Breakbeat 130; hits tuned by ear.
- `src/synth/drumClock.ts` — the bar and beat rule that applies a waiting change; reports what it applied.
- `src/synth/engine.ts` — the step loop applies the waiting pattern, its tempo and the echo times at step 0, layers at each beat.
- Tests: `test/drumPatterns.test.ts`, `test/drumClock.test.ts`.

**Key decisions:**
- The worklet reports what it applied; the page never computes the bar.
- Echo times change inside the step loop, so they land on the bar.

**Watch out for:**
- Two wishes within one bar must leave only the latest waiting → the waiting slot is overwritten, never queued; test: Rock → House → Hip-hop within a bar applies Hip-hop.

_Spec 2.0: the hand's pattern and height bands, and the band rule exported from `handToSynth.ts` for them, were removed; `noteLane` is private again._

---

### Task 05: drum-live-code

**Files to modify:**
- `src/synth/snippet.ts:25-30` — `gibberSnippet` takes the loop heard: tempo, drums, or null. While it plays it starts with `Clock.bpm = …`, then one stock instrument per layer playing, each sequenced on sixteenths; `STOCK_NAMES` (`:18`) gains them.
- `src/synth/drumPatterns.ts` — the snippet reads the same step data and kit settings as the engine.
- `src/main.ts:94-97` — `showCode` passes the reported loop, or null when stopped.
- `test/snippet.test.ts` — Hip-hop at 2 layers; stopped.

**Patterns to reuse:**
- `voiceCode` and `settings()` (`src/synth/snippet.ts:32-69`).

**Key decisions:**
- Each instrument's `trigger.seq` (`node_modules/gibber.audio.lib/js/instruments.js:252-293`) over `EDrums`, whose score strings are commented out in this version (`node_modules/gibber.audio.lib/js/drums.js:154-164`).

**Watch out for:**
- Pasted drums sound different: Gibber's stock defaults (`node_modules/gibberish-dsp/js/instruments/kick.js:38-45`) aren't the engine's kit → print every kit setting from the shared constant; test: snippet settings equal the kit's.
- gibber.cc runs its own Gibber build; the paste check stays manual, as for the voices.

---

### Task 06: drum-buttons

**Files to modify:**
- `src/mapping/drumLoop.ts` — `stepPattern` (wrapping over `DRUM_PATTERNS`) and `stepLayers` (1–4, the same loop at either end); `startDrums`, `steerDrums`, `muteDrums` and `muted` removed.
- `src/ui/drumPanel.ts` — ◀ Start/Stop ▶, then − and +, then the line; `drumWords(loop)` and `drumControls(loop, engine)` pure, for Node tests. Pattern: `src/ui/audioPanel.ts:23-45`.
- `src/mapping/shape.ts` — back to two modes; `secondHandWithoutDrums` removed.
- `src/synth/engine.ts`, `src/synth/snippet.ts` — `Drums | null` instead of `DrumsToPlay`; the drum level goes up on start, down on stop.
- `src/ui/overlay.ts` — the drum label removed.
- `src/main.ts`, `src/ui/styles.css`; tests `test/drumLoop.test.ts`, `test/drumPanel.test.ts`, `test/shape.test.ts`, `test/snippet.test.ts`.

**Key decisions:**
- The panel line shows the loop's choice, not the worklet's report, so a pattern chosen mid-bar is named at once; the live code still shows what is heard.
- The no-camera path needs no drum controls of its own: the buttons work without a hand.

**Watch out for:**
- A step at a bound must not resend the loop → `stepLayers` returns the same object; test: 1 with −, 4 with +.

---

### Task 07: drum-guidance

**Files to modify:**
- `src/ui/helpSheet.ts:28-60` — <kbd>D</kbd> under Keys; "Start drums / Stop drums", ◀ ▶ and − + under Mouse and touch.

_Spec 2.0: no drum gesture, so `src/ui/gestureGuide.ts` stays as it is._
