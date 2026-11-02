---
feature: hand-tracking
status: APPROVED
reviewed: 2026-11-02
head: cf76677c05088c01cbc060df89e940bb1c3a1d97
---

# Review — hand-tracking

**Scope**: 7 files (re-verification — delta since the review of `c95b60b6`; 1 workflow artifact under `.ai/` excluded)
**Findings**: 0 must-fix · 0 should-fix · 0 nit

## Findings

### F-1 · should-fix · convention · startup orchestration has no test   [ADDRESSED]
**File**: `src/hands/startup.ts:57-78`, `src/hands/startup.ts:121-126`
**Issue**: No test exercises the logic that decides which source is active. That covers three things: Try again is ignored while a request is in flight; the tracker starts once the camera and the model are both ready, in either order; the sliders start on the first failure and stop when tracking starts. The empty HandState sent when the camera is lost is not tested either.
**Change**: Add `test/startup.test.ts`. Mock `../src/hands/camera`, `../src/hands/model` and `../src/hands/tracker` with `vi.mock`, the way `test/model.test.ts:4` mocks `@mediapipe/tasks-vision`. Cover the four behaviours above.
**Why**: Four acceptance criteria describe this logic and a test can check it. They are task 01 (Try again, REQ-3), task 02 (Try again restarts the download, REQ-5) and task 05 (sliders replace the video when the model failed, and the video replaces the sliders after Try again, REQ-16).

### F-2 · nit · bug · camera loss during start shows the wrong reason   [ADDRESSED]
**File**: `src/hands/startup.ts:89-90`
**Issue**: Suppose the camera track ends while `video.play()` is still pending, for example because the camera is unplugged at that moment. The ended handler (lines 80-84) sets "Camera disconnected" and clears `srcObject`, which makes `play()` reject with `AbortError`. Line 90 then overwrites the status with that result, so the panel shows "Camera couldn't start (AbortError)".
**Change**: At line 90, apply `cam.start()`'s result only while `camera.kind` is still `'pending'`. A disconnect reported during the request is then kept.

### F-3 · nit · bug · unguarded runtime setup can hang the loading state   [ADDRESSED]
**File**: `src/hands/model.ts:29`
**Issue**: `FilesetResolver.forVisionTasks` is awaited outside both `try` blocks. If it rejected, `loadHandModel` would reject, and `void loadModel()` (`src/hands/startup.ts:111`) would drop the error. The panel would stay on "Loading hand model…" with no Try again and no sliders.
**Change**: Wrap line 29 in a `try`/`catch` like lines 23-27. Return `{ failure: { reason: 'damaged' } }`, which is what `runtimeFailure` already returns for an unrecognised runtime error.
**Why**: The pinned 1.2.0 cannot reject here, because its only check catches its own error. The guard keeps CLAUDE.md's "Don't hide failures" rule true across a future version bump.

### F-4 · nit · bug · overlay reopens with slider-era labels   [ADDRESSED]
**File**: `src/ui/overlay.ts:105-111`
**Issue**: The sliders also feed `draw()`. So when tracking starts after a Try again, `setVisible(true)` builds the labels from the last slider state, and this lasts until the tracker's first frame:
- the gesture label shows the menu's choice (e.g. "Victory · 100%") or "No gesture";
- "Raise your hand" stays hidden;
- slider updates from the last second count toward the first fps reading (line 97).
**Change**: When the overlay turns visible, set `last` to null, start a fresh fps meter, and set the fps text back to "— fps". The meter comes from `createFpsMeter()`, so `meter` becomes `let`.
**Why**: REQ-14 says "Raise your hand" shows when no hand is detected.

### F-5 · nit · convention · gestureText tests live in the gesture debounce test   [ADDRESSED]
**File**: `test/gesture.test.ts:4`, `test/gesture.test.ts:65-77`
**Issue**: `test/gesture.test.ts` also tests `gestureText` from `src/ui/gestureLabels.ts`. Every other test file covers only the module it is named after.
**Change**: Move the `describe('gestureText')` block and its import to a new `test/gestureLabels.test.ts`, following `test/fpsMeter.test.ts`.
