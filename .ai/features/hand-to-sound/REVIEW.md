---
feature: hand-to-sound
status: DRAFT
reviewed: 2026-11-03
head: e6190fa13003f167d78a9f8ef24d8fb0f2e334da
---

# Review — hand-to-sound

**Scope**: 21 files (primary — diff since base `04e233f4`; 8 workflow artifacts under `.ai/` excluded)
**Findings**: 0 must-fix · 2 should-fix · 0 nit

## Findings

### F-1 · should-fix · bug · live code panel is blank until hand states start   [ADDRESSED]
**File**: `src/main.ts:257-266`
**Issue**: The snippet is shown only from hand states. Those start only once the camera and the hand model are ready, or once the sliders appear. So the live code panel stays empty while the camera prompt is open or the model downloads, and "Start audio" can already be clicked then.
**Change**: Show the snippet for no hand once at boot, right after `showCode` is created: `showCode(mapHandToSynth(EMPTY_HAND, null))`. This follows `src/hands/startup.ts:62`, which emits `EMPTY_HAND` when no tracker runs.
**Why**: REQ-15 and its edge case "Snippet before Start audio → shown and updating": a first-time visitor sees an empty code panel during the first seconds of the visit.

### F-2 · should-fix · convention · tuned slide times are not pinned by a test   [ADDRESSED]
**File**: `src/synth/ramp.ts:15-18`
**Issue**: `PITCH_SLIDE_MS` and `CUTOFF_RAMP_MS` are marked "Tuned by ear", but no test reads them. `test/ramp.test.ts` checks `slideSamples` with the literals 15 and 40, so changing either constant breaks no test.
**Change**: Drive the `slideSamples` test from the two constants and assert their spec values, 40 ms and 15 ms. This follows `test/mapping.test.ts:29-31`, which pins the 15 ms pinch ramp.
**Why**: CLAUDE.md requires a tuned threshold to change together with its test and the spec. The spec's NFR names 15 ms and 40 ms.
