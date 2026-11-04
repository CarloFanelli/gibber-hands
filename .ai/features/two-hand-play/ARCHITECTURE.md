---
feature: two-hand-play
spec-version: 1.0
status: approved
---

# Architecture Plan: Two-hand play

## Technical Approach

### Overview

The contract between vision and audio becomes a pair of hands by the player's side: right and left, each a HandState as today, plus each side's landmarks. `hands/` decides each tracked hand's side; the role (lead hand or second hand), the second hand's mode, the octave and the effect amount are pure rules in `mapping/`, their state held in `main.ts`. The engine builds one chain per preset per side (12), each with its own volume glide after its own effect, so a silent hand silences its echoes as today; the Web Audio gain becomes Start/Stop only, followed by a limiter for two loud hands. `mapHandToSynth` keeps its shape and is called once per playing side. No new dependency.

### Shared Concerns

#### Wiring only in main

- **Appears in**: Task 01, Task 02, Task 03, Task 04, Task 05, Task 06
- **Reference example**: `src/main.ts:67-79`
- **Rule**: modules expose small interfaces and `main.ts` connects them; state carried between frames lives there: the hand pair, each side's last SynthParams, the lead side, the second hand's mode and the octave.
- **Watch out for**: `startup.onHand` keeps one listener (`src/hands/startup.ts:120-122`); extend the one in `main.ts:137`.

#### Pure core, thin shell

- **Appears in**: Task 01, Task 02, Task 03, Task 04, Task 05, Task 06
- **Reference example**: `src/mapping/handToSynth.ts` with `test/mapping.test.ts`; `src/hands/presence.ts` with `test/presence.test.ts`
- **Rule**: every spec rule lives in a pure module tested in Node: side assignment, roles, the Victory switch, octave hysteresis, effect amount, snippet text, step order. Tests run without a DOM (`vite.config.ts:8`, environment `node`).

#### Glides in the worklet

- **Appears in**: Task 02, Task 03, Task 04
- **Reference example**: `levelGraph` in `src/synth/engine.ts:70-74`; `slideSamples` in `src/synth/ramp.ts:22-29`
- **Rule**: a value the engine changes while sound plays glides inside Gibber's worklet through a `…Slide` input; set the slide length before the value (`engine.ts:216-217`), since each is one message.

## Per-Task Technical Guidance

### Task 01: both-hands-tracked

**Files to create:**
- `src/hands/handSlots.ts` — pure: matches each frame's hands to the tracked ones by nearest palm center, gives a new hand its side from its left/right label (both the same: further right is right), keeps it until gone. Pattern: `src/hands/presence.ts`.
- `src/mapping/roles.ts` — pure: lead side from the stored value (right when missing or unreadable); lead and second hand of a pair.
- `src/ui/leadHandSwitch.ts` — the swap button, `aria-pressed`. Pattern: `src/ui/audioPanel.ts`.
- `test/handSlots.test.ts`, `test/roles.test.ts`.

**Files to modify:**
- `src/hands/model.ts:37` — `numHands: 2`.
- `src/hands/types.ts`, `src/hands/tracker.ts` — the pair contract; one presence, smoothing and gesture debounce per slot; one pair per frame.
- `src/hands/startup.ts:62` — the empty pair when tracking stops.
- `src/ui/sliders.ts` — emits its hand on the lead side.
- `src/ui/overlay.ts` — both hands; a gesture label per side.
- `src/main.ts` — one sounding hand: the lead if present, else the second.
- `src/ui/styles.css` — the swap button; the right side's gesture label (`:84-85`).
- `test/startup.test.ts`, `test/sliders.test.ts`.

**Key decisions:**
- Sides, not roles, cross the contract: the swap is a UI preference applied in `roles.ts`. Task 02 keys voices by side, so a swap never moves a sounding note.
- Stored under `gibber-hands-lead-hand` through `src/ui/storage.ts`.

**Watch out for:**
- MediaPipe's left/right label may describe a mirrored image; the installed types don't say (`node_modules/@mediapipe/tasks-vision/vision.d.ts:959-960`) → first step: log a real right hand's label; convert only in `handSlots.ts`; test: a real right hand leads.
- Presence identifies the hand by its label (`src/hands/presence.ts:27`, `src/hands/tracker.ts:43`): a flickering label ends and restarts it → identify by slot; test: label flips for one frame, no fade, side kept.
- The tracker reads index 0 of each result array (`src/hands/tracker.ts:41-54`) → read landmarks, label and gesture by the same index per hand; test: two hands reported in swapped order, sides kept.
- Two landmark passes per frame may drop the i5 under 25 fps → measure with the frame-rate label, two hands, audio on, before Task 02.
- Whether `numHands: 2` keeps the two tracked hands when a third appears isn't in the code → check by hand; slots keep sides by position either way.

---

### Task 02: two-notes-at-once

**Files to modify:**
- `src/synth/engine.ts` — a chain per preset per side: voice, send, effect, preset level, then the side's volume as a worklet glide (see Glides in the worklet). The Web Audio gain (`:162-164`) becomes Start/Stop, then a `DynamicsCompressorNode` limiter. `update` takes both sides.
- `src/synth/snippet.ts` — one chain per sounding side, the second with numbered names (`saw2`, `lpf2`, `verb2`); one side gives today's text.
- `src/main.ts` — maps each playing side with its own previous SynthParams; the first-sound timer counts either side.
- `src/ui/overlay.ts:113-123` — lights every playing side's lane.
- `test/snippet.test.ts`.

**Key decisions:**
- Each side's volume follows its own effect, as today's volume does (`engine.ts:8-10`): a fist or a lost hand silences that side's echoes (hand-to-sound REQ-12, REQ-13). A shared effect would leave tails.
- The limiter's threshold sits above today's one-hand peak (−4.8 dBFS), so one hand passes unchanged.
- First step: a browser spike with 12 chains. If audio drops out or tracking falls under 25 fps on the i5, stop and ask.

**Watch out for:**
- Per-voice state (`engine.ts:201`) and `sent` (`:207`) are single → per side, else one hand's silence decides the other's glide; test: right holds a note, left starts from silence without gliding.
- A side's chain that never played feeds 440 Hz into its effect (`engine.ts:176`) → keep its send closed until its first note, as `rising` does (`:225-231`); test: left's first note has no 440 Hz tail.
- `wanted` (`engine.ts:86`) replays one sound on start → keep both; test: Start audio while both hands squeeze, both sound.
- `setPreset` moves one voice (`engine.ts:239-247`) → switch both sides, each jumping to its note before its level rises; test: switch with two hands, no pitch sweep, within 60 ms.

---

### Task 03: octave-squeeze

**Files to create:**
- `src/mapping/shape.ts` — pure: the second hand's mode (switches when its debounced gesture becomes Victory); octave up at the full-volume squeeze, down past a tuned level; a fist is no squeeze. Pattern: `src/mapping/handToSynth.ts:12-26` constants.
- `test/shape.test.ts`.

**Files to modify:**
- `src/mapping/handToSynth.ts` — takes the octave; doubles frequency and cutoff; SynthParams carries the octave.
- `src/mapping/notes.ts` — a note name one octave up (B♭3 → B♭4).
- `src/synth/engine.ts:215-216` — an octave change jumps the pitch.
- `src/synth/snippet.ts` — names the note from lane and octave.
- `src/ui/overlay.ts`, `src/ui/styles.css` — mode and "Octave up" labels, icons under 320 px (`overlay.ts:15`); lane names in the octave.
- `src/main.ts` — mode and octave state; the second hand silent in shape mode; a swap resets the mode.
- `test/mapping.test.ts`, `test/snippet.test.ts`, `test/notes.test.ts`.

**Key decisions:**
- "The gesture label's confirmation time" is the debounce (`src/hands/gesture.ts:8-9`). It restarts when a hand is lost (`src/hands/tracker.ts:46`), so a hand back in view showing Victory switches once.
- The sliders' hand leads: its gesture menu never switches.
- The octave-down level is tuned by ear: constant, test, spec and `docs/PROCESS.md` together.
- On an octave jump the pitch jumps; the cutoff keeps its 15 ms ramp.

**Watch out for:**
- A hand switched to shape mode must fade like a lost hand (`handToSynth.ts:52-58`, 100 ms), not like a fist → map it as absent; test: switch while sounding, fades in 100 ms.
- The snippet names notes by frequency (`snippet.ts:22`): a doubled one prints Hz → name from lane and octave; test: Saw Lead's top lane raised reads D6.
- The engine glides any pitch change while heard (`engine.ts:215`) → an octave change jumps; test: a recording shows no glide.
- Gains were measured at 6,400 Hz (`src/synth/presets.ts:6-8`) → measure every preset at 12,800 Hz with two hands; test: peak ≤ −3 dBFS.

---

### Task 04: effect-by-height

**Files to modify:**
- `src/mapping/shape.ts` — amount from the second hand's height in the playing zone: 0 at the bottom, the preset's mix at the middle, double at the top, at most 0.8. Pattern: `brightness` in `handToSynth.ts:82-85`.
- `src/synth/engine.ts` — each effect runs fully wet; dry and wet levels glide; `update` takes the amount.
- `src/synth/ramp.ts` — the amount's glide time, tuned by ear.
- `src/synth/snippet.ts` — prints the amount as the effect's mix.
- `src/ui/overlay.ts` — the percent label.
- `src/main.ts` — the preset's own mix without a second hand in shape mode; recomputed on a preset switch.
- `test/shape.test.ts`, `test/snippet.test.ts`.

**Key decisions:**
- The split reproduces the stock mix exactly, so the snippet stays stock Gibber.

**Watch out for:**
- Freeverb's `wet1`/`dry` and Delay's `wetdry` are inputs set once per message (`gibber.audio.js:20068`, `19769`): stepped per frame, they zipper → fully wet effect, dry and wet glided; test: sweep in 0.5 s, clean spectrogram.
- Freeverb outputs reverb × wet1 + input × dry (`gibber.audio.js:20108`), Delay mixes input and echo (`19769`) → match both; test: engine and snippet within 0.02 dB at 45%.
- The reverb is stereo and the dry voice mono; `Add` accepts either (`gibber.audio.js:23465-23468`) → confirm in the spike.

---

### Task 05: slider-shape-controls

**Files to modify:**
- `src/ui/sliders.ts` — an "Octave up" checkbox and an "Effect" range at 0.5, native like `:57-64`. They emit the second hand: present, pinch 0 or 1 from the switch, height from the slider.
- `src/main.ts` — while the sliders run, the second hand is in shape mode.
- `src/ui/styles.css` — the checkbox row; outlines come from `:focus-visible` (`:13`).
- `test/sliders.test.ts`.

**Key decisions:**
- The controls emit a second hand in shape mode, so the octave and amount rules of Tasks 03 and 04 apply unchanged: the switch is a full or open squeeze, the slider a height.

**Watch out for:**
- The slider second hand must never play a note → force shape mode only while the sliders run; test: no camera, "Octave up" off, pinch slider at full, one note sounds.

---

### Task 06: second-hand-guidance

**Files to modify:**
- `src/ui/stepHints.ts` — a `shape` step, its words from the lead side, a Victory icon, hidden after 10 s per visit.
- `src/ui/helpSheet.ts` — a "With two hands" section; hand names in spans set on a swap.
- `src/main.ts` — after the first-sound flag, shows the shape step unless done or on the sliders; marks it done on the first switch.
- `src/ui/styles.css` — the Victory icon, still under reduced motion (`:97`).
- `test/stepHints.test.ts`.

**Key decisions:**
- Done flag `gibber-hands-shape-hint-done` through `src/ui/storage.ts`; the 10 s hide is per visit only.

**Watch out for:**
- Today one flag ends all step hints (`src/main.ts:95`) → the shape step has its own flag, checked after it; test: after the first sound it shows; after a switch and a reload it doesn't.
- The help sheet is a fixed `innerHTML` (`src/ui/helpSheet.ts:51`) → hand names in `textContent` spans; test: swap, the sheet names the left hand as lead.
