---
feature: drum-loop
status: DRAFT
reviewed: 2026-11-05
head: 2b46b6cd04192b8143d0ead84b59702f95f7e874
---

# Review — drum-loop

**Scope**: 28 files (fallback A — commits since the drum-loop spec was added, `0cb422b`; the diff since base `552abfe5` was rejected: 55 files, mostly the two-hand-play and note-range work that shares that base; 13 workflow artifacts under `.ai/` excluded)
**Findings**: 0 must-fix · 0 should-fix · 3 nit

## Findings

### F-1 · nit · convention · test name still orders the patterns left to right   [ADDRESSED]
**File**: `test/drumPatterns.test.ts:17`
**Issue**: The test name says the drum patterns run "left to right", the palm's order in the removed drum mode; the ◀ and ▶ buttons now step through them.
**Change**: Rename it to "lists Rock, House, Hip-hop and Breakbeat, in the order the arrows step through them, each at its own tempo".

### F-2 · nit · convention · note-lane comments worded for the removed drum bands   [ADDRESSED]
**File**: `src/mapping/handToSynth.ts:19`, `src/mapping/handToSynth.ts:87-89`, `src/mapping/handToSynth.ts:97-98`
**Issue**: These comments were reworded when the lane rule was shared with drum mode's pattern and height bands ("counts in the band past it", "the lane under `x` counts"); that sharing is gone, and "band" is not the glossary's word for a note lane.
**Change**: Restore the wording the lines had before the drum loop (`git show 83b6ca1:src/mapping/handToSynth.ts`, lines 19 and 86-98): "the lane under `x` plays", "A palm center exactly on a border plays the lane to its right".
**Why**: CLAUDE.md asks for the glossary's terms; the rule now serves note lanes only.

### F-3 · nit · simplify · equivalent rewrites left by the drum-mode removal   [ADDRESSED]
**File**: `src/mapping/shape.ts:2-5`, `src/mapping/shape.ts:26-27`, `src/mapping/shape.ts:59`, `src/mapping/shape.ts:62`, `src/ui/overlay.ts:23-26`, `src/ui/overlay.ts:78-81`, `src/main.ts:44-52`
**Issue**: Drum mode added a third mode here, and its removal brought the behavior back but not the text: the Victory switch, `asPlayed`, the swap comment, `MODE_WORDS`, a doc comment and the shape import are rewritten or reflowed with no change in behavior.
**Change**: Restore these lines as they are in `83b6ca1`, before the drum loop, so the feature's diff holds only drum code; the swap comment then names the Victory sign again.
