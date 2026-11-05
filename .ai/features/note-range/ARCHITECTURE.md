---
feature: note-range
spec-version: 1.1
status: approved
---

# Architecture Plan: Note range

## Technical Approach

### Overview

The lane count is a pure rule in `mapping/` (one note lane per 80 CSS px of playing zone, 8 to 16), fed by a small UI watcher that measures the letterboxed camera picture. Presets carry all 16 notes and `main.ts` passes the first N to the mapping, the overlay and the sliders' note readout, so `mapHandToSynth` keeps its signature and reads the count from the lanes it gets. The octave becomes a signed shift (−1, 0 or 1) decided in `mapping/shape.ts`; `SynthParams.octave`, the engine's no-slide rule, `raiseOctave` and the snippet already handle any whole number, so `synth/engine.ts` is not touched. The code panel becomes two parts, live code and gesture guide, inside the same Resizer panel: "Hide code" hides only the code part, so the panel never leaves the Resizer row. The code–guide divider is a new module modelled on the vendored Resizer handle, not a change to it; no new dependency.

### Shared Concerns

#### Wiring only in main

- **Appears in**: Task 01, Task 02, Task 04
- **Reference example**: `src/main.ts:101-133` (`playHands`), `src/main.ts:153-165` (`guide`)
- **Rule**: modules expose small interfaces and `main.ts` connects them; state carried between frames (lane count, octave shift) lives there.
- **Watch out for**: decide "the sliders send the hands" with the predicate at `src/main.ts:112` (`!startupStatus.tracking && sliders !== null`), never with `cameraMode(...) === 'sliders'`: the status words change during a retry (two-hand play review F-1).

#### Pure core, thin shell

- **Appears in**: Task 01, Task 02, Task 03, Task 05
- **Reference example**: `src/mapping/shape.ts` with `test/shape.test.ts`
- **Rule**: each spec rule (lane count, picture rectangle, octave shift, slider shaping hand, saved split) is a pure function tested in Node; tests have no DOM (`vite.config.ts:8`), so DOM code stays thin and is checked in the browser.

#### Help sheet stays the full reference

- **Appears in**: Task 03, Task 04, Task 05
- **Reference example**: `src/ui/helpSheet.ts:17-59`
- **Rule**: each task edits the rows of `CONTENT` for the behaviour it adds; a row that names a hand uses a `data-hand="lead|second"` span, named by side at boot and on every swap (`helpSheet.ts:67-72`).

## Per-Task Technical Guidance

### Task 01: more-note-lanes

**Files to modify:**
- `src/mapping/handToSynth.ts` — replace `LANE_COUNT` (`:15-16`) with `laneCount(zoneWidthPx | null)`: 80 px per lane (tuned by ear), 8–16, 8 for null; `noteLane` (`:78-86`) takes the count from `lanes.length`.
- `src/synth/presets.ts` — each `lanes` holds the 16 notes of the spec table; doc: the first N play.
- `src/ui/overlay.ts` — `drawLanes` divides by the number of names (`:166`, `:177`); `videoRect` (`:103-110`) uses the shared helper.
- `src/main.ts` — keep the count; pass `lanes.slice(0, count)` to the mapping (`:118`), `showNote` (`:127`) and `overlay.setLanes` (`:187`); recount on width and startup-status changes.
- `README.md:15` — "8 lanes" becomes 8 to 16.
- `test/presets.test.ts`, `test/mapping.test.ts` — 16-note table; 719/720/1280/null; hysteresis after a count change.

**Files to create:**
- `src/ui/zoneWidth.ts` — the contain-rectangle helper moved from `overlay.ts:103-110`, and a watcher: ResizeObserver on the overlay canvas (as `overlay.ts:58-62`) plus the video's `loadedmetadata` and `resize` events; reports the playing zone's CSS width, null without a picture.
- `test/zoneWidth.test.ts` — the helper: black bars excluded.

**Key decisions:**
- Count = `lanes.length`: slicing in `main.ts` is the only place the count applies.

**Watch out for:**
- A lane held while the count shrinks indexes past the lanes and throws — `src/mapping/handToSynth.ts:80-81` → hold it only while below the count; test: lane 9 held, count drops to 8, palm at the right edge plays lane 8.
- Fixtures read `PRESETS[i].lanes` as 8 lanes — `test/mapping.test.ts:7-8`, `test/sliders.test.ts:68` → slice them to 8, else lane assertions silently test 16 lanes; test: existing lane assertions pass unchanged.
- With the model failed and the camera on, the hidden video still has a width — `src/ui/styles.css:31` → count from the sliders predicate (`main.ts:112`) first; check: block the model download, camera allowed: 8 lanes.
- Gains were measured at today's top notes — `src/synth/presets.ts:6-8` → measure two hands on every preset's lane 16, octave raised, brightest; test: peak ≤ −3 dBFS.

---

### Task 02: octave-down-sign

**Files to modify:**
- `src/mapping/shape.ts` — `octaveRaised` (`:30-34`) becomes a signed shift: −1 while the shaping hand shows `Thumb_Down`, +1 by today's squeeze hysteresis, else 0; header updated.
- `src/mapping/handToSynth.ts` — `SynthParams.octave` doc (`:45`): −1, 0 or 1; header (`:8`). `2 ** octave` (`:54`) already halves note and brightness.
- `src/main.ts` — `raised` (`:98`, `:113-114`, the swap reset) becomes the shift; `overlay.draw` passes it (`:223`).
- `src/ui/overlay.ts` — `SecondHandView.octaveUp` (`:29`) becomes the shift; the octave label (`:91-92`, `:228`) shows "↑ Octave up" or "↓ Octave down", rewritten only when the shift changes (dataset check as `:218-221`).
- `test/shape.test.ts`, `test/sliders.test.ts` — `octaveRaised` callers; `test/mapping.test.ts` (100–3,200 Hz), `test/notes.test.ts` (E2 down is E1), `test/snippet.test.ts` (lowered note named).

**Patterns to reuse:**
- The squeeze rule and its tests: `test/shape.test.ts:39-66`.

**Key decisions:**
- The thumbs-down wins over a squeeze: a squeeze straight into it drops two octaves, as the spec says.
- No smoothing: `HandState.gesture` is already confirmed over 100 ms (`src/hands/gesture.ts:9`, `:39`).
- `engine.ts` and `snippet.ts` untouched: no slide across octaves (`engine.ts:252`); the snippet names `raiseOctave(name, p.octave)` (`snippet.ts:36-37`).

**Watch out for:**
- The limiter threshold sits on today's one-hand peak — `src/synth/engine.ts:43` → measure two hands on every preset's lowest lane lowered (Deep Bass E1, 41 Hz), darkest and brightest; test: peak ≤ −3 dBFS, no click on drop.

---

### Task 03: slider-octave-choice

**Files to modify:**
- `src/ui/sliders.ts` — `octaveUp` (`:30`, `:36`, `:67`, `:105-113`) becomes an octave of −1, 0 or 1 set by a native radio group "Octave" (fieldset and legend: Down, Normal, Up), Normal at start; `shapingHandState` (`:54-57`) shows Up as a closed squeeze and Down as a `Thumb_Down` gesture, so the rule in `shape.ts` decides both.
- `src/ui/styles.css` — the radio group inside `.sliders`, 44 px rows as `.slider-switch` (`:38-39`).
- `src/ui/helpSheet.ts:57` — "Octave up" becomes the Octave choice.
- `test/sliders.test.ts` — Down at full pinch plays half the frequency; Up as today; the shaping hand stays silent.

**Key decisions:**
- Native radios give Tab, arrow keys and the `:focus-visible` outline (`styles.css:13`) with no script, as the header promises (`sliders.ts:4-5`).
- The sliders' second hand stays `SLIDERS_SECOND_HAND`, always in shape mode (`sliders.ts:39`), so Down never sounds a note.

---

### Task 04: gesture-guide

**Files to modify:**
- `src/ui/layout.ts` — the code panel holds a code part and a guide part; the toggle (`:41-50`) hides only the code part, so nothing sets `panel-hidden` (Resize still requires the option, `:39`); `Layout` exposes `code` and `guide`, and the toggle is renamed.
- `src/main.ts` — create the guide in `ui.guide`; name its hands on boot and on swap (beside `help.setLeadSide`, `:203`); in `guide()` (`:153-165`) tell it whether the sliders send the hands.
- `src/ui/styles.css` — `.panel-code` (`:75-80`) becomes two halves, each `flex: 1 1 0` and scrolling; drop the dead `panel-hidden` rules (`:21`, `:25`) and comment (`:15-16`).
- `src/ui/helpSheet.ts` — a thumbs-down row naming the second hand; extra lanes in the palm row; C and "Hide code" hide the code only (`:42`, `:52`).
- `src/ui/shortcuts.ts:2` — doc: C hides the code.

**Files to create:**
- `src/ui/gestureGuide.ts` — a fixed `<dl>` of the spec's eight rows plus the sliders line; pattern `src/ui/helpSheet.ts:17-79`.

**Patterns to reuse:**
- Move the `data-hand` naming loop (`helpSheet.ts:67-71`) into `src/ui/handWords.ts`, used by the sheet and the guide.

**Watch out for:**
- The snippet fills and scrolls only as a flex child of the panel — `src/ui/styles.css:76`, `:80`, `overflow: hidden` at `:17` → make the code part the flex column, retarget the selectors; check: a two-voice snippet scrolls in a short panel.

---

### Task 05: code-guide-divider

**Files to modify:**
- `src/ui/layout.ts` — mount the divider between the parts; hiding the code hides it, showing restores the share.
- `src/ui/styles.css` — divider styled as `.resize-handle` (`:23-24`) turned horizontal, `cursor: row-resize`; parts sized by the share with `min-height: 120px`; `.panel-code` as a size container so under 240 px the divider hides and the parts split evenly (as `@container camera`, `:114`).
- `src/ui/helpSheet.ts` — ↑ ↓ in Keys and a divider row in Mouse and touch (beside `:46`, `:56`).

**Files to create:**
- `src/ui/codeGuideSplit.ts` — `role="separator"`, horizontal, `aria-valuenow` = code share; pointer drag with pointer capture; ArrowUp/ArrowDown 24 px; pure helpers: the saved share (0.5 when missing or outside 0–1) and a share clamped to 120 px each side; storage through `src/ui/storage.ts`, key `gibber-hands-code-split` (naming as `main.ts:57-64`).
- `test/codeGuideSplit.test.ts` — the pure helpers.

**Patterns to reuse:**
- Vendored Resize handle: keyboard (`src/vendor/resizer/Resize.ts:127-154`), limits (`:190-201`), percentages after a move (`:203-216`), 24 px step (`:33`).

**Key decisions:**
- A new module, not a Resize change: Resize is horizontal-only, changed only by minimal fixes.
- Save a share, not pixels: a window resize keeps it.

**Watch out for:**
- C on the focused divider hides it, dropping focus to the page — C fires on any non-field focus (`src/ui/shortcuts.ts:24-27`) → keep the whole-panel focus check (`layout.ts:43`), so focus moves to "Show code"; check: focus the divider, press C.
