---
feature: hand-tracking
spec-version: 1.0
status: approved
---

# Architecture Plan: Hand Tracking

## Technical Approach

### Overview

MediaPipe stays inside `src/hands/`. The tracker turns each result into a HandState plus a plain list of landmark points in player space for the overlay, so `ui/` and `mapping/` never import it. Every number the spec sets (palm center, hand size, pinch, 150 ms hold, smoothing, 0.6/100 ms debounce) lives in a small pure module under `src/hands/`, unit-tested with synthetic landmarks in the Node test environment (`vite.config.ts:8`). A new `src/hands/startup.ts` runs the camera request and the hand model load in parallel and reports their status, so `src/main.ts` stays wiring only (`src/main.ts:4-5`). No new dependencies: frames come from `requestVideoFrameCallback` (lib.dom.d.ts:21782, Baseline 2024 in all four target browsers), and the model is fetched by our own code so it can report progress. Coordinates are mirrored once, in `src/hands/geometry.ts`; CSS mirrors only the video pixels.

### Shared Concerns

#### Factory with a small interface

- **Appears in**: Task 01, Task 02, Task 03, Task 05
- **Reference example**: `src/ui/layout.ts:22`, `src/hands/tracker.ts:19-24`
- **Rule**: each new module exports a `createX(...)` function returning a small interface; no classes, no module-level state.

#### Pure core, thin shell

- **Appears in**: Task 01, Task 02, Task 03, Task 04, Task 05
- **Reference example**: `src/mapping/handToSynth.ts:26` with `test/mapping.test.ts`
- **Rule**: spec numbers live in pure functions that take plain values and timestamps as arguments (never `performance.now()` inside), each with a test in `test/`; DOM and MediaPipe code only calls them.
- **Watch out for**: a pure module must not import `@mediapipe/tasks-vision`, or the Node test run loads the browser bundle.

#### Status in the camera panel

- **Appears in**: Task 01, Task 02, Task 05
- **Reference example**: `src/ui/layout.ts:23-35` (panel markup built from a template)
- **Rule**: `hands/` reports reason codes; `src/ui/cameraPanel.ts` owns every user-facing text, the progress line and the Try again buttons.
- **Watch out for**: today a failure only reaches the console (`src/main.ts:32`); every failure path must end in the panel.

## Per-Task Technical Guidance

### Task 01: camera-view

**Files to modify:**
- `src/ui/layout.ts:23-27` — camera panel gets a status layer and the "Video stays on your device" line.
- `src/ui/styles.css:12` — video: `object-fit: contain` (letterbox) and `scaleX(-1)`; canvas: neither (see Task 03).
- `src/main.ts` — start `startup` before any `await`; remove the tracker/slider fallback (lines 29-34) until Tasks 03 and 05, because the stub sliders wipe the camera panel.

**Files to create:**
- `src/hands/camera.ts` — requests `{ video: { facingMode: 'user' }, audio: false }`, attaches the stream, reports `ended` as disconnected; pure `cameraFailure(errorName, isSecure)`.
- `src/hands/startup.ts` — owns the camera request and its retry, one request in flight; extended by Tasks 02, 03, 05.
- `src/ui/cameraPanel.ts` — reason to message, Try again (disabled while pending), unblock hint.
- `test/camera.test.ts` — every error name to its reason.

**Key decisions:**
- Reasons (MDN getUserMedia exceptions): not a secure context → not secure; `NotAllowedError` → blocked, dismissal included; `NotFoundError`, `OverconstrainedError` → not found; `NotReadableError` → in use; anything else → "Camera couldn't start" with the name.

**Watch out for:**
- Insecure page throws instead of naming the reason: `navigator.mediaDevices` is undefined there but typed as always present (lib.dom.d.ts:25823) → check `isSecureContext` first; test: insecure flag maps to not secure.
- Camera prompt waits for the synth: `src/main.ts:23` awaits `createSynth()` first → start camera and model before any await; test: manual, prompt appears on load.
- Try again leaves the previous stream running → stop its tracks before requesting again; test: two Try agains leave one live track.

---

### Task 02: hand-model-loading

**Files to modify:**
- `src/hands/startup.ts` — start the model load together with the camera request; status carries progress or failure; one load in flight.
- `src/ui/cameraPanel.ts` — "Loading hand model… N%" line; failure with Try again, none when WebAssembly is missing.

**Files to create:**
- `src/hands/model.ts` — fetches the model with progress (Content-Length) and a 30 s stall abort; then `FilesetResolver.forVisionTasks` (vision.d.ts:833) and `GestureRecognizer.createFromOptions` (vision.d.ts:855) with `modelAssetBuffer`, `runningMode: 'VIDEO'`, `numHands: 1`, delegate GPU, then CPU on failure.
- `src/hands/modelSource.ts` — model URL, CDN base with `MEDIAPIPE_VERSION`, pure failure classifier; no MediaPipe import.
- `test/modelSource.test.ts` — version equals the installed `package.json` (relative JSON import, typechecks today); every failure case.

**Key decisions:**
- Own fetch: `modelAssetPath` is fetched with no progress (vision_bundle.mjs, `if(e.modelAssetPath)return fetch(`); `modelAssetBuffer` takes a `Uint8Array` (vision.d.ts:27).
- Model first, then runtime: clear failure attribution. Percentage = model bytes, capped at 99% until the recognizer exists. Parallel only if the 10 s target is missed (CLAUDE.md: don't optimise before milestone 2).
- Failures: no `WebAssembly` → unsupported; fetch `TypeError` → no network if `navigator.onLine` is false, else that file is blocked; script `error` Event → runtime loader (vision_bundle.mjs, `Uh`); `Aborted(` → runtime binary (wasm/vision_wasm_internal.js:265, 304); else → damaged model.

**Watch out for:**
- Two loads at once corrupt each other: the runtime sets and clears a global `self.ModuleFactory` (vision_bundle.mjs, `Jh`) → one load in flight, Try again disabled meanwhile; test: double-click Try again, one recognizer.
- Overlay canvas passed to MediaPipe gets a WebGL context (vision.d.ts:2902-2907) and breaks 2D drawing → never pass `canvas`; MediaPipe creates its own OffscreenCanvas (vision_bundle.mjs, graph runner constructor).
- GPU failure reported as "damaged model" → classify only the CPU retry's error; test: GPU failure forced, model loads on CPU silently.

---

### Task 03: tracked-hand-overlay

**Files to modify:**
- `src/hands/types.ts` — `palm {x,y}` replaces `index`, never null (empty: 0.5/0.5); `handedness` removed; `gesture` typed to the seven names or null; `HandSource` callback also receives landmarks (null from sliders).
- `src/hands/tracker.ts` — `createTracker(video, recognizer)`, no canvas: `requestVideoFrameCallback` loop, `recognizeForVideo` (vision.d.ts:911), geometry, presence, smoothing.
- `src/hands/startup.ts` — start the tracker once camera and recognizer are both ready; camera `ended` emits an empty HandState.
- `src/mapping/handToSynth.ts:27,32-33`, `test/mapping.test.ts:11,12,18` — read `palm`; behaviour unchanged.
- `src/ui/layout.ts:19,56-61` and `src/main.ts:27-41` — overlay stub replaced by `src/ui/overlay.ts`.

**Files to create:**
- `src/hands/geometry.ts` — mirror x once, finite check, palm center (0,5,9,13,17), clamp.
- `src/hands/presence.ts` — 150 ms hold; reset after a longer frame gap.
- `src/hands/smoothing.ts` — One Euro filter for the palm center.
- `src/ui/overlay.ts` — canvas sized to the panel × `devicePixelRatio` via `ResizeObserver`; drawn inside the letterboxed video's rectangle; labels as DOM text.
- `src/ui/fpsMeter.ts` — frames per 1 s window, "— fps" before.
- `test/geometry.test.ts`, `test/presence.test.ts`, `test/smoothing.test.ts`.

**Key decisions:**
- One Euro filter instead of the EMA in `src/hands/tracker.ts:12`: an EMA steady enough for 0.3% lags 2+ frames. Its constants are tuned values.

**Watch out for:**
- Hand drawn on the wrong side: `src/ui/styles.css:12` flips the canvas while geometry flips x → flip only the video; test: geometry maps raw x 0.2 to 0.8; manual: right hand drawn on the right.
- MediaPipe rejects non-increasing timestamps ("Packet timestamp mismatch", vision_wasm_internal.wasm) → pass max(now, last + 1) to `recognizeForVideo`; test: manual, tab switch and Try again keep tracking.
- A held hand survives a tab switch, since hidden tabs deliver no frames → on `visibilitychange` to hidden emit an empty HandState; reset presence and smoothing when frames are > 150 ms apart; test: 1 s gap resets both.

---

### Task 04: pinch-and-gestures

**Files to modify:**
- `src/hands/geometry.ts` — hand size (landmarks 0 to 9); pinch (4 to 8) and middle pinch (4 to 12) divided by it, clamped; previous values held when hand size < 2% of frame width.
- `src/hands/tracker.ts` — first gesture of the followed hand (`gestures`, `categoryName`, `score`: vision.d.ts:971, 99-108) through the debounce into HandState.
- `src/ui/overlay.ts` — "Pointing up · 87%" or "No gesture"; confidence rounded to a whole percent.

**Files to create:**
- `src/hands/gesture.ts` — label check ("None" and unknown labels → null) and debounce: a candidate wins after ≥ 100 ms at ≥ 0.6; reset when presence turns false.
- `src/ui/gestureLabels.ts` — display names of the seven gestures, reused by Task 05.
- `test/gesture.test.ts`; pinch cases added to `test/geometry.test.ts`.

**Key decisions:**
- Distances in aspect-corrected image space (x scaled by frame width / height): on a 16:9 frame raw x and y units differ, so pinch would change with hand rotation.
- 0.6, 100 ms and 2% are named constants with tests (CLAUDE.md tuning rule).

---

### Task 05: slider-fallback

**Files to modify:**
- `src/ui/sliders.ts` — four `<input type="range">` (0..1, step 0.01) and a gesture `<select>` using `src/ui/gestureLabels.ts`; emits on subscribe and on `input`; `stop()` removes the controls; pure state-to-HandState function exported.
- `src/ui/styles.css` — controls fit the width; touch targets ≥ 44 px.
- `src/hands/startup.ts`, `src/main.ts` — one active HandState source: sliders on any camera or model failure, including a camera lost mid-session; stopped when tracking starts.

**Files to create:**
- `test/sliders.test.ts` — initial state, ends exactly 0 and 1, gesture confidence 1 or 0.

**Key decisions:**
- Native range inputs and select: keyboard and touch support built in, labelled with `<label>`.
- Video and overlay are hidden, never removed, so a successful Try again can show them again.

**Watch out for:**
- Sliders wipe the camera panel: `src/ui/sliders.ts:13` sets `innerHTML` on the panel root passed at `src/main.ts:33` → mount in an own container; test: Try again after a failure shows the video.
- First HandState lost: the callback is registered after creation (`src/ui/sliders.ts:16`) → emit on subscribe; test: a new subscriber receives palm 0.5/0.5 at once.
- Sliders and tracker both emitting after recovery → stop the sliders before the tracker starts; test: after recovery, moving a slider emits nothing.
