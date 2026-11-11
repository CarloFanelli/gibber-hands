---
feature: tailwind-styles
status: APPROVED
reviewed: 2026-11-11
head: 0cfbfcb9bedf978d6b6c34e0c25e7dc24a99d08f
---

# Review — tailwind-styles

**Scope**: 30 files (re-verification — the working tree since `0cfbfcb9`, still uncommitted, so the same files as the first pass plus `src/ui/look.ts` and `scripts/look.mjs`; only the F-1 fix is new; 6 workflow artifacts under `.ai/` excluded)
**Findings**: 0 must-fix · 0 should-fix · 0 nit

## Findings

### F-1 · nit · dead · two class names nothing reads any more   [ADDRESSED]
**File**: `src/ui/topBar.ts:24`, `src/ui/presetList.ts:33`
**Issue**: `top-bar` on the header and `presets` on the card list were selectors of the old stylesheet; no code, script or copied library looks them up now, so they read as hooks that aren't.
**Change**: Drop `top-bar` from the header's class list and the `presets` class from the list, keeping only hook classes that `querySelector`, `classList` or the look check use, as `src/ui/layout.ts:61` keeps `side-strip`.
