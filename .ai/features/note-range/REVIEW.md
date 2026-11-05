---
feature: note-range
status: DRAFT
reviewed: 2026-11-05
head: 552abfe58e22dffc0022d42a48be36e324c09ead
---

# Review — note-range

**Scope**: 26 files (Fallback B — the file lists of the note-range plan, plus `src/mapping/notes.ts`, `src/ui/liveCode.ts` and `test/shortcuts.test.ts`, which /dev also touched). The diff since base `552abfe5` lists 47 files, mostly two-hand play work that is still uncommitted and was reviewed on its own, and the spec was never committed, so there are no feature-window commits. 25 workflow artifacts under `.ai/` excluded.
**Findings**: 0 must-fix · 1 should-fix · 1 nit

## Findings

### F-1 · should-fix · bug · guide says "No camera" when the hand model failed   [ADDRESSED]
**File**: `src/ui/gestureGuide.ts:18`
**Issue**: The guide's first line, "No camera: the sliders stand in for your hand.", shows whenever the sliders send the hands (`src/main.ts:169`). The sliders also take over when the camera works but the hand model fails to load (`src/hands/startup.ts:69`). The visitor then sees their own camera picture next to a line saying there is no camera.
**Change**: Word the line so that it holds for both causes, without naming one. Use the status line's word for this state ("Sliders", `src/ui/statusLine.ts:17`): for example, "Sliders: they stand in for your hand until the camera tracks it."
**Why**: The rule to never hide failures (CLAUDE.md, "What not to do") also means not naming the wrong one. A blocked hand-model download, on a school network for example, leaves the camera on.

### F-2 · nit · bug · lanes lit from the old lane count after a count change   [ADDRESSED]
**File**: `src/ui/overlay.ts:245-247`
**Issue**: `setLanes` redraws with the lanes lit in the last `draw()`, which numbered them for the old lane count (`src/ui/overlay.ts:164`). Say a hand plays lane 15 of 16 and the camera panel is narrowed to 12 lanes. Until the next tracked frame, a lit strip is drawn a quarter of the playing zone's width past its right edge. When the count grows instead, the lit strip shows in the wrong lane.
**Change**: In `setLanes`, when `names.length` differs from `laneNames.length`, drop the lit lanes until the next `draw()`, the way `setVisible` forgets `last` (`src/ui/overlay.ts:236-237`).
