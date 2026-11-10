---
feature: ui-redesign
spec-version: 1.0
status: approved
---

# Architecture Plan: UI Redesign

## Technical Approach

### Overview

The redesign rebuilds the page shell in `src/ui/layout.ts` and moves existing UI modules (audio button, status line, left-handed switch, presets, drums, live code, gesture guide) into new containers without changing what they do. The `HandPair` contract, `mapping/`, `synth/` and `hands/` stay untouched. `main.ts` stays wiring only, and each new concern gets its own small file: side panel, top bar, sounds panel, hand-tag placement, welcome dialog, bottom bar. Narrow windows reuse the same elements, restyled as bottom sheets by a media query, so no content is duplicated. No new dependency: Resizer keeps the side panel's width, and drag-kit keeps the card drag. Moving the sounds panel is a small pointer-event module of its own, because drag-kit is a drop-zone library.

### Shared Concerns

#### Remembered layout

- **Appears in**: Task 01, Task 03, Task 05
- **Reference example**: `src/ui/codeGuideSplit.ts:18` (`savedShare`, a pure parse of a stored string, tested in `test/codeGuideSplit.test.ts`) and `src/ui/storage.ts`. Task 01 deletes that file, so Tasks 03 and 05 follow `src/ui/sidePanel.ts`, which Task 01 creates on the same pattern.
- **Rule**: every remembered value is read through `readStored`/`writeStored` and validated by a pure, unit-tested parse function, which falls back to the first-visit value on anything unreadable.
- **Watch out for**: the tests run in Node (`vite.config.ts`, `environment: 'node'`), so only pure functions are unit-tested. Keep DOM wiring thin.

#### Studio look tokens

- **Appears in**: Task 02, Task 03, Task 04, Task 05, Task 06, Task 07
- **Reference example**: `src/ui/styles.css:1-8` (`:root` custom properties)
- **Rule**: colours, surfaces, radii and the monospace stack are `:root` custom properties set once in Task 02. Later rules use the tokens, never raw hex values.

#### Keyboard shortcuts

- **Appears in**: Task 01, Task 03, Task 04, Task 05
- **Reference example**: `src/ui/shortcuts.ts:24` (pure `shortcut()` returning an `Action`, tested in `test/shortcuts.test.ts`)
- **Rule**: a new key is a new `Action` kind in `shortcut()` plus a test, and `main.ts` maps the action to its module. No module listens to `keydown` for shortcuts on its own.

## Per-Task Technical Guidance

### Task 01: side-panel-tabs

**Files to modify:**
- `src/ui/layout.ts` — two Resizer panels (camera, instrument) plus the new side panel. The old `#panel-code` becomes the side panel host. Drop the code-guide split. `toggleCode` becomes collapse/expand, via Resizer's `classToCheck` (`panel-hidden`), which already rescales the visible panels (fix 3).
- `src/ui/styles.css` — side panel width 360 px default and 280 px min-width, tab styles, the collapsed strip. Remove the `.code-split` rules.
- `src/ui/shortcuts.ts`, `src/ui/helpSheet.ts` — C now means "side panel". Update the help wording.
- `.ai/features/{instrument-ui,note-range,two-hand-play,drum-loop}/SPEC.md` — mark the superseded requirements and bump each version.

**Files to create:**
- `src/ui/sidePanel.ts` — tabs, collapse button, collapsed strip, remembered tab and open state (Remembered layout). The pattern is `src/ui/codeGuideSplit.ts`.
- `test/sidePanel.test.ts` — the parse of the saved tab and open state.

**Files to delete:** `src/ui/codeGuideSplit.ts`, `test/codeGuideSplit.test.ts`.

**Key decisions:**
- The width stays with Resizer (lineage, keyboard handles, saved shares). The tab and open state go under their own storage key.
- Resizer saves each width as a share of the row, so a restored width is a share of the window, not pixels.

**Watch out for:**
- The half-window limit can't come from the camera panel's `min-width: 50%`: Resizer fix 4 reads `parseFloat(getComputedStyle().minWidth)`, so it gets 50 px (`src/vendor/resizer/Resize.ts:178`). Guard: a minimal, logged fix that resolves a percentage against the row. Test: drag stops at half.
- Old saves hold 3 entries, and `readSizes` (`Resize.ts:250`) needs the count to match. Returning visitors therefore get the 360 px first-visit width. That is intended: the spec says an unreadable save gives the first-visit layout.

---

### Task 02: top-bar-stage

**Files to modify:**
- `src/ui/layout.ts` — add `<header class="top-bar">` above the panel row, and expose its slots. `#app` becomes a column: bar, then a row.
- `src/main.ts` — mount `createAudioPanel`, `createStatusLine` and `createLeadHandSwitch` in the top bar instead of `ui.instrument`. Add the Help button, wired to `help.toggle`.
- `src/ui/statusLine.ts` — words plus icon spans, so a 720–900 px bar shows icons with the words as their label.
- `src/ui/styles.css` — studio tokens (Shared Concerns), the top bar, and `.prominent` sized as the page's largest control. Move `.camera-privacy` into the bar.
- `index.html` — favicon `<link>`.

**Files to create:**
- `src/ui/topBar.ts` — builds the bar's slots and the Help button. The pattern is `src/ui/leadHandSwitch.ts`.
- `public/favicon.svg` — a hand glyph in the accent colour.

**Patterns to reuse:**
- `src/ui/audioPanel.ts`: its failure card and Try again work in any root.
- Sliders and camera cards stay in `#camera-status` (`styles.css:26`), so REQ-3 needs no new code.

**Key decisions:**
- The camera stays `object-fit: contain` (`styles.css:25`). REQ-2 needs no code, only the stage taking the remaining width.

**Watch out for:**
- The site is served under `/gibber-hands/` (`vite.config.ts:7`). Check that `dist/index.html` carries the based favicon path. Test: `npm run build`, then the preview logs no 404.

---

### Task 03: sounds-panel

**Files to modify:**
- `src/ui/layout.ts` — remove the instrument panel from the Resizer row. Add a floating `<section class="sounds-panel">` in the stage with a title bar, a shrink button and the icon.
- `src/main.ts` — mount `createDrumPanel` and `createPresetList` into the sounds panel. S maps to shrink/restore.
- `src/ui/shortcuts.ts` (+ test) — `sounds` action for S.
- `src/ui/styles.css` — floating panel, icon state, z-order under the top bar.

**Files to create:**
- `src/ui/soundsPanel.ts` — title-bar pointer drag, shrink/restore, window-resize re-clamp, remembered position and state.
- `src/ui/panelPlacement.ts` + `test/panelPlacement.test.ts` — pure clamp of a position inside the stage rectangle, and the parse of the saved position.

**Patterns to reuse:**
- Remembered layout (Shared Concerns). `src/ui/presetList.ts` stays as it is.

**Key decisions:**
- Pointer events only on the title bar, so drag-kit's `mousedown` on cards (`dragedrop.js:57`) never moves the panel.
- The position is stored as a fraction of the stage, so it survives window changes.
- The stage rectangle bounds the panel, which keeps it off the top bar and the side panel.

**Watch out for:**
- drag-kit sets dragged cards to `position: absolute` from `offsetTop` (`dragedrop.js:76-77`). Inside a fixed panel that scrolls, a dragged card can be clipped or offset. Guard: no `overflow` clipping during a card drag. Test: drag Brass onto "Now playing".

---

### Task 04: hand-tags

**Files to modify:**
- `src/ui/overlay.ts` — replace the corner `handLabels` groups (`overlay.ts:76`) with one tag per hand, positioned each frame near the palm center through `transform`. Remove the `overlay-hint` "Raise your hand" label. The fps label is hidden by default, with a `toggleFps()` method.
- `src/main.ts` — pass the roles to `overlay.draw`. F maps to `toggleFps`. Drop the `hideRaiseHand` wiring.
- `src/ui/shortcuts.ts` (+ test) — `fps` action for F.
- `src/ui/styles.css` — tag style, and remove `.overlay-hand-*` and `--hint-top` juggling (`styles.css:113-125`).

**Files to create:**
- `src/ui/tagPlacement.ts` + `test/tagPlacement.test.ts` — pure: tag boxes from palm points, flipped away from the edges, kept inside the picture rectangle, stacked when overlapping.

**Patterns to reuse:**
- `setText` and `showWords` in `overlay.ts`, `gestureText` in `src/ui/gestureLabels.ts`, and the hand names from `src/ui/handWords.ts`.

**Key decisions:**
- The tag text uses roles ("Lead", "Second"), following the glossary, not sides.

**Watch out for:**
- `draw()` runs every frame (`overlay.ts:202`). Reading tag sizes forces layout. Guard: measure a tag only when its text changes, and write only `transform`. Test: ≥ 25 fps on the i5 laptop with two hands.

---

### Task 05: welcome-help-dialogs

**Files to modify:**
- `src/ui/helpSheet.ts` → rename to `src/ui/helpDialog.ts`. It lists controls and keys only, adds a "Show gestures" link, and drops `nameHands`.
- `src/ui/shortcuts.ts` (+ test) — with a dialog open, only `help` and Escape pass.
- `src/main.ts` — create the welcome dialog unless `HINTS_DONE_KEY` is set (`main.ts:72`), close it in the `firstSound` callback, and wire "Start playing" to `audio.startOrStop`.
- `src/ui/sidePanel.ts` — `showTab('gestures')`, which expands the panel.

**Files to create:**
- `src/ui/welcomeDialog.ts` — a `<dialog>` with `showModal`, a backdrop click to close, and a guard against a second start. The pattern is `helpSheet.ts`.

**Patterns to reuse:**
- `showModal()` keeps focus inside and makes the page behind it inert, so REQ-23 needs no focus trap. Focus returns on close, with a fallback to Start audio when the opener is hidden.

**Key decisions:**
- One dialog at a time: opening help closes the welcome dialog.

**Watch out for:**
- Shortcuts listen on `window` (`shortcuts.ts:42`), so today "1" changes the preset behind an open help sheet. Guard: pass "a dialog is open" into `shortcut()`. Test: "1" does nothing with help open.

---

### Task 06: narrow-sheets

**Files to modify:**
- `src/ui/styles.css` — replace the stacked block (`styles.css:167-171`) with a `max-width: 719.98px` block. Side panel and sounds panel become fixed bottom sheets, the Resizer handle and title-bar drag are hidden, and the bottom bar shows.
- `src/ui/layout.ts` — the bottom bar with two buttons.
- `src/ui/soundsPanel.ts` — ignore drag below 720 px. Its saved position is kept for wide windows.

**Files to create:**
- `src/ui/bottomSheets.ts` — which sheet is open (`data-sheet` on `#app`), close on ×, on a stage tap, and on a `matchMedia` change.

**Patterns to reuse:**
- The same DOM as the desktop panels, restyled. No content is duplicated.

**Key decisions:**
- "Show gestures" calls `sidePanel.showTab`, and `bottomSheets` opens the matching sheet when narrow.

---

### Task 07: studio-look-check

**Files to modify:**
- `src/ui/styles.css` — consistency pass on tokens and transitions (≤ 200 ms, `prefers-reduced-motion` honoured as in `styles.css:141`).
- `docs/PROCESS.md` — the fps check and the visitor test, written at the moment.

**Patterns to reuse:**
- The contrast rationale already in `styles.css:43`: a dark solid background behind labels over the video.

**Key decisions:**
- Contrast is checked with the browser's accessibility audit, adding no dependency.
