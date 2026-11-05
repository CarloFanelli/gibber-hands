---
feature: two-hand-play
status: APPROVED
reviewed: 2026-11-05
head: 552abfe58e22dffc0022d42a48be36e324c09ead
---

# Review — two-hand-play

**Scope**: re-verification of 2 files changed since the review of `552abfe5` (`src/main.ts`, `src/ui/overlay.ts`). Nothing is committed yet, so the script's delta lists all 37 files of the first pass; the other 35 are unchanged since it read them in full. 19 workflow artifacts under `.ai/` excluded.
**Findings**: 0 must-fix · 0 should-fix · 0 nit

## Findings

### F-1 · must-fix · bug · slider shaping hand plays notes during a retry   [ADDRESSED]
**File**: `src/main.ts:110`
**Issue**: The sliders' second hand counts as shaping only while the status reads "Sliders", but the slider fallback keeps running through a camera or hand-model retry, when the status reads "Camera off" or "Camera on" (`src/hands/startup.ts:65-71` stops the fallback only once tracking can start; `src/ui/statusLine.ts:13` stops calling it sliders as soon as nothing has failed). In that window the slider shaping hand is played as a note-playing second hand: with "Octave up" on, moving any slider or switching preset sounds a second note at full volume in the middle lane, and the octave switch and effect slider stop working. A hand-model retry can last many seconds while the model downloads again.
**Change**: Decide "the sliders stand in" from the active hand source, not from the status words: shape mode for the sliders' second hand whenever the slider fallback is what sends hand pairs (for example `!startupStatus.tracking && sliders !== null`, the same lifetime `src/hands/startup.ts:65-71` gives the fallback).
**Why**: The second hand of the sliders must never play a note, whatever the camera does: the risk the plan flagged for the slider shape controls (REQ-21).

### F-2 · nit · convention · gesture label rewritten on every frame   [ADDRESSED]
**File**: `src/ui/overlay.ts:216`
**Issue**: Each hand's gesture label is written on every frame, while the labels beside it in the same loop go through `setText`, which this diff added because `draw()` runs every frame.
**Change**: Write it with `setText(labels.gesture, gestureText(state.gesture, state.gestureScore))`, as `src/ui/overlay.ts:225-226` do.
