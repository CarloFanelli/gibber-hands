---
feature: ui-redesign
status: APPROVED
reviewed: 2026-11-11
head: 0cfbfcb9bedf978d6b6c34e0c25e7dc24a99d08f
---

# Review — ui-redesign

**Scope**: 8 files (re-verification — delta since the review of `0cfbfcb9`, working tree included; 3 workflow artifacts under `.ai/` excluded)
**Findings**: 0 must-fix · 0 should-fix · 0 nit

## Findings

### F-1 · should-fix · bug · focus lost after "Start playing"   [ADDRESSED]
**File**: `src/ui/audioPanel.ts:43`
**Issue**: "Start playing" closes the welcome dialog, then starts audio. The audio toggle turns `disabled` while audio starts, so the dialog's close handler focuses a disabled button through the `audioButton` fallback (`src/main.ts:266`), and focus falls to the page body. This was checked in headless Chrome: `document.activeElement` is `BODY` before and after audio is on.
**Change**: Keep the toggle focusable while audio starts: mark it `aria-disabled="true"` instead of `disabled`, ignore presses while it's starting in the toggle's click handler and in `startOrStop`, and restyle `.audio-toggle:disabled` at `src/ui/styles.css:90` for the attribute.
**Why**: REQ-23: closing a dialog returns focus to its opener, or to Start audio when the opener is gone.

### F-2 · should-fix · bug · hand tag size kept when the camera view's width changes   [ADDRESSED]
**File**: `src/ui/overlay.ts:111`
**Issue**: A tag's cached size is cleared only when its words change. Below a camera view width of 560 px, a container query hides `.label-words`, so crossing that width with a tag shown leaves a stale size. When the view widens, words that were hidden reappear, and the tag is placed with a width that's too small, past the picture's right edge.
**Change**: Set `tags.right.size` and `tags.left.size` to `null` in the canvas ResizeObserver callback at `src/ui/overlay.ts:63`, before `render()`.
**Why**: REQ-24 edge case: the hand tag stays fully inside the picture.

### F-3 · should-fix · convention · process log says resizing the side panel needs a mouse   [ADDRESSED]
**File**: `docs/PROCESS.md:373`
**Issue**: The "Known gap" says resizing the side panel needs a mouse, but the resize handle is focusable and moves with ← → (`src/vendor/resizer/Resize.ts:132-151`), as the help dialog says. The task 07 notes repeat the same claim.
**Change**: Say only that moving the sounds panel needs a mouse, and that the spec leaves it out of scope. Fix the second note in `tasks/07-studio-look-check.md` the same way.

### F-4 · nit · bug · widening the window sends focus to a hidden button   [ADDRESSED]
**File**: `src/ui/bottomSheets.ts:67`
**Issue**: The `change` handler closes the sheet through `show(null)`, which moves focus from inside the sheet to its bottom-bar button. That button is already `display: none` in a wide window, so focus falls to the page body.
**Change**: In the `change` handler, close the sheet without the refocus line (e.g. pass a flag to `show`, or set `open = null` and the attributes directly). The panel the focus was in stays visible as the desktop panel.

### F-5 · nit · bug · "Show gestures" on a phone expands the desktop side panel for later   [ADDRESSED]
**File**: `src/ui/layout.ts:73-74`
**Issue**: In a narrow window, `showGestures` opens the sheet and also calls `side.showTab('gestures')`. That saves `open: true`, so a visitor who had collapsed the side panel on desktop finds it expanded next time.
**Change**: When `sheets.open('side')` returns true, switch the tab without changing the saved open state: let `showTab` keep the current `open` value when told to, or add a tab-only call on the side panel.
**Why**: REQ-12: later visits restore the side panel's open state.

### F-6 · nit · convention · README key list out of date   [ADDRESSED]
**File**: `README.md:42`
**Issue**: The "Keys" line leaves out S and F, and calls C "code" though it now collapses the side panel with the code and the gestures.
**Change**: Match the help dialog's list (`src/ui/helpDialog.ts:22-28`): add S (sounds panel) and F (frame rate), and name C "side panel".

### F-7 · nit · convention · bottom sheets header misdescribes the other button   [ADDRESSED]
**File**: `src/ui/bottomSheets.ts:3-4`
**Issue**: The comment says the other bottom-bar button closes the open sheet. It swaps it for the other sheet (`show(open === sheet ? null : sheet)`).
**Change**: Reword it as: "its × button or a tap on the camera closes it, and the other button swaps it for the other sheet".

## Runtime observations

- The project's checks are green: typecheck, 314 tests in 33 files, and the build.
- Also fixed in this delta, outside the findings: the side panel's collapse didn't hide it on desktop. `.panel-side { display: flex }` came later in `styles.css` than `.panel-hidden`, so the panel and its strip both showed. `.panel.panel-hidden` now wins; checked in headless Chrome on desktop and on a phone.
- Two acceptance criteria wait on Carlo, not on code (task 07 notes): ≥ 25 fps on both reference laptops with both panels open, and the 3-visitor test. Their results are blanks in `docs/PROCESS.md`.
