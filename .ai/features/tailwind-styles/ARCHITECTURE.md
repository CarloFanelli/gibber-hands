---
feature: tailwind-styles
spec-version: 1.0
status: approved
---

# Architecture Plan: Tailwind Styles

## Technical Approach

### Overview

Tailwind v4 (4.3.5, peer `vite ^8`) enters through `@tailwindcss/vite` in `vite.config.ts`; `src/ui/styles.css` becomes the Tailwind entry (`@import "tailwindcss"` plus a CSS-first `@theme` holding the `:root` tokens at `styles.css:1-16`). Styles move area by area from `styles.css` into utility classes in the TypeScript that builds each element; each task deletes the rules it moved. Class names that code or the copied libraries look up stay on the elements as plain hooks, without styles of their own. Tasks 01–05 must match the baseline exactly; only Task 06 changes the look.

### Shared Concerns

#### Hook classes stay

- **Appears in**: Task 02, Task 03, Task 04, Task 05
- **Reference example**: `src/ui/layout.ts:15,46,57` (`panel`, `panel-hidden`, `resize-handle`), `src/ui/topBar.ts:32-35`, `src/ui/presetList.ts:20,77-84`
- **Rule**: a class that `querySelector`, `classList` or Resizer/drag-kit reads keeps its name; its look moves to variants on it or its parent (`[&.panel-hidden]:hidden`, `group-[.sounds-shrunk]:`, `aria-pressed:`, `data-[step=hand]:`).
- **Watch out for**: Resizer's `classToCheck` is `panel-hidden` (`layout.ts:57`); renaming it breaks the saved widths.

#### Button patterns

- **Appears in**: Task 02, Task 03, Task 05, Task 06
- **Reference example**: `styles.css:88-90,107` (outlined), `styles.css:89` (filled)
- **Rule**: patterns used 3+ times (outlined button, filled button, quiet icon button, visually hidden words) are exported class strings from one new `src/ui/look.ts`, written out in full.

#### Look check

- **Appears in**: every task
- **Reference example**: none in the repo; the contrast audit to fold in is the UI redesign's (8 states).
- **Rule**: every task ends with `npm run look -- compare` reporting no difference (Task 06: only the explained ones).

## Per-Task Technical Guidance

### Task 01: tailwind-foundation

**Files to modify:**
- `package.json` — devDependencies `tailwindcss`, `@tailwindcss/vite`; script `look`.
- `vite.config.ts` — add the Tailwind plugin.
- `src/ui/styles.css` — `@import "tailwindcss"`, `@theme` with the tokens (colours, `--font-mono`, radii 4/6/8/10/12, the two shadows); existing rules unchanged, placed in `@layer components` so utilities win later.
- `.gitignore` — `.look/`.

**Files to create:**
- `scripts/look.mjs` — `capture` / `compare`: drives Chrome over the DevTools protocol (no new package), fake camera flags for the live screen, dumps each visible element's box, colours and font per screen and width, saves screenshots, runs the contrast audit.

**Key decisions:**
- Baseline goes to gitignored `.look/baseline/`, captured from the current build before `styles.css` changes; re-capturable from commit `base` in a worktree.
- Keep preflight, neutralise what differs (see Watch out).

**Watch out for:**
- Preflight sets `line-height: 1.5` on html and `display: block` on `svg`; today line-height is normal and the lock and step-hint icons are inline → set both back in the base layer; test: compare at 1280.
- Unlayered rules beat Tailwind's layered utilities → old rules go into a layer.

---

### Task 02: top-bar-dialogs

**Files to modify:**
- `src/ui/topBar.ts`, `statusLine.ts`, `audioPanel.ts`, `statusCard.ts`, `leadHandSwitch.ts`, `welcomeDialog.ts`, `helpDialog.ts` — utilities on each element.
- `src/ui/styles.css` — delete `:88-129` and `:198-220` as they move.

**Files to create:**
- `src/ui/look.ts` — the Button patterns (see Shared Concerns).

**Patterns to reuse:**
- Hook classes stay (`top-audio`, `top-status`, `top-lead`, `top-help`, `help-show-gestures`, `prominent`).

**Key decisions:**
- Container queries: `@container/top-bar` on the bar, `@max-[1100px]/top-bar:` etc.; confirm in `node_modules/tailwindcss` that `@max-[N]` compiles to `width < N`, matching today's `max-width: N-0.02px`.

**Watch out for:**
- `.prominent` must outrank the button's own size utilities (`styles.css:98`) → style it as `[&.prominent]:` on the same element; test: welcome screen at 1280 and 360.
- `statusCard.ts` is shared with the camera view: `.top-bar .status-card` overrides (`:95-96`) become top-bar variants, not changes to the card.

---

### Task 03: sounds-panel

**Files to modify:**
- `src/ui/soundsPanel.ts`, `presetList.ts`, `drumPanel.ts` — utilities.
- `src/ui/styles.css` — delete `:55-87` and `:130-135`, except the drag-kit block.

**Patterns to reuse:**
- Button patterns; Hook classes stay (`sounds-panel`, `sounds-shrunk`, `preset-dragging`, `drop-ready`, `drop-over`).

**Key decisions:**
- drag-kit adds `preset-dragging`/`drop-ready`/`drop-over` itself (`presetList.ts:77-84`); style them with `[&.drop-ready]:` variants on the element, which the scanner finds in `presetList.ts`.
- Keep `.preset + .preset { pointer-events: none }` (`styles.css:81`) in the leftover stylesheet: it targets drag-kit's clone.

**Watch out for:**
- The shrunk rule is desktop-only (`styles.css:64`); unscoped it strips the phone sheet's background → `min-[720px]:` on the shrunk variant; test: 390 px sounds sheet with a shrunk save.

---

### Task 04: camera-stage

**Files to modify:**
- `src/ui/layout.ts` — utilities on the camera section, video, canvas, status box.
- `src/ui/sliders.ts`, `cameraPanel.ts`, `overlay.ts`, `stepHints.ts` — utilities.
- `src/ui/styles.css` — delete `:35-54` and `:163-197`, keeping keyframes, the mirror and reduced motion.

**Patterns to reuse:**
- Visually hidden words from `look.ts`; `@container/camera` with `@max-[560px]/camera:` and `@max-[320px]/camera:`.

**Key decisions:**
- Step animations as `data-[step=hand]:animate-[hint-rise_1.4s_ease-in-out_infinite]` on the icon's parent selector, keyframes stay in CSS; `motion-reduce:animate-none`.
- The `--hint-top`/`--hint-height` variables (`styles.css:172-174`) stay as arbitrary values.

**Watch out for:**
- `overlay.ts:118` positions tags with inline `transform`; a `translate-*` utility would be overwritten silently → no transform utilities on `.hand-tag`.

---

### Task 05: side-panel-sheets

**Files to modify:**
- `src/ui/layout.ts`, `sidePanel.ts`, `liveCode.ts`, `gestureGuide.ts`, `bottomSheets.ts` — utilities.
- `src/ui/styles.css` — delete `:22-34`, `:136-162`, `:221-239`, keeping the Resizer handle.

**Patterns to reuse:**
- Hook classes stay (`panel`, `panel-hidden`, `side-strip`, `sounds-panel`, `data-sheet` on `#app`).

**Key decisions:**
- Narrow rules become `max-[720px]:` variants; those overriding Resizer's inline widths and the sounds panel's inline transform need `!` (today `!important`, `styles.css:226-230`).
- `liveCode.ts:33` builds `code-${token.kind}` → replace with a literal map from kind to classes.

**Watch out for:**
- The sheet open state lives on `#app[data-sheet]` (`bottomSheets.ts:53`) → panels need `group-data-[sheet=side]/app:` with `group/app` on `#app`; test: both sheets at 390.

---

### Task 06: hover-press-text

**Files to modify:**
- `src/ui/look.ts` — `hover:`/`active:`/`enabled:` states on the button patterns.
- Each file with a 13 or 17 px text — the five-size scale.
- `src/ui/styles.css` — remove the default text scale in `@theme` (`--text-*: initial`) and define only 12/14/16/18/20; trim to ≤ 80 lines.
- `docs/PROCESS.md` — the milestone entry.

**Key decisions:**
- `hover:` in v4 applies only on devices that can hover, covering the touch edge case; confirm in `node_modules/tailwindcss`.
- Icons drawn as text keep their sizes as arbitrary values.

**Watch out for:**
- A lighter accent fill can drop the dark text under 4.5:1 → check with the look check's audit; test: hovered Start audio.
