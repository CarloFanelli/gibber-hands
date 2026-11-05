---
feature: instrument-ui
spec-version: 1.0
status: approved
---

# Architecture Plan: Instrument UI

## Technical Approach

### Overview

The six presets reshape the sound path. A pure preset table holds each preset's lanes, sound and effect. The mapping takes the current preset's lanes as an argument. The engine builds one voice per preset and crossfades between them inside Gibber's worklet, while the Web Audio volume after the worklet stays the single hand volume. Resizer and drag-kit are copied under `src/vendor/` with minimal, listed fixes; everything else is small new modules in `src/ui/`. No new dependency.

### Shared Concerns

#### Wiring only in main

- **Appears in**: Task 02, Task 04, Task 05, Task 06
- **Reference example**: `src/main.ts:30-57`
- **Rule**: each module exposes a small interface and `main.ts` connects them. State carried between events lives there: the last sound, the last HandState and the current preset.
- **Watch out for**: `startup.onHand` keeps only the last callback (`src/hands/startup.ts:120-122`): extend the single listener in `main.ts:50`, never register a second one.

#### Pure core, thin shell

- **Appears in**: Task 02, Task 04, Task 05, Task 06
- **Reference example**: `src/synth/snippet.ts` with `test/snippet.test.ts`; `src/ui/throttle.ts`
- **Rule**: every rule the spec states lives in a pure module tested in Node: the preset table, note frequencies, step-hint order, status words, key mapping and code colouring. DOM code only wires it.
- **Watch out for**: tests run with no DOM (`vite.config.ts:8`, environment `node`), so a tested module must not touch `document` or `localStorage` at import.

#### Storage that may be blocked

- **Appears in**: Task 01, Task 02, Task 04
- **Reference example**: none yet; `src/ui/storage.ts`, created in Task 02
- **Rule**: every read and write of browser storage survives a throwing or blocked storage and an unreadable value, and falls back to the spec's default without an error.

## Per-Task Technical Guidance

### Task 01: resizable-panels

**Files to create:**
- `src/vendor/resizer/Resize.ts`, `src/vendor/resizer/Resizer.ts` — copies of Resizer at 41bb3ca. The header links the commit and lists each fix.

**Files to modify:**
- `src/ui/layout.ts` — builds `Resize` over the three panels (`saveName` `gibber-hands`). Adds the code panel's hide button and returns a toggle that Task 05's C key calls. Drops the stale TODO (lines 4–9).
- `src/ui/styles.css` — default widths 45/25/30%, the handle style, and the hide class. Under 720 px: no handles and `width: auto`, so saved widths don't apply.

**Key decisions — the listed Resizer fixes:**
- The 5 strict-TypeScript errors (CLAUDE.md gotcha).
- Storage reads and writes guarded (Resize.ts:64, 154–172). Unreadable data, or a count other than 3, is ignored.
- A drag clamped so neither neighbour drops under 160 px (Resize.ts:137–138).
- Widths back to percentages when a drag ends (Resize.ts:142–150), so window resizes keep proportions.
- `console.log` removed (Resize.ts:18).

**Watch out for:**
- `.panel { flex: 1 1 0 }` ignores the widths Resizer sets — `src/ui/styles.css:13` → give panels a width-based flex basis; test: drag, reload, sizes restored.
- Hiding a panel rescales saved sizes by index — `Resize.ts:68-71` gives camera and instrument 67.5% + 37.5% → keep panels shrinkable, or fix it; test: hide code, the two panels fill the row 45:25.
- The canvas is reallocated on every resize step — `src/ui/overlay.ts:37-41` → measure fps while dragging with audio on; if it drops, resize once per animation frame.
- Releasing outside the window relies on `document.onmouseup` — `Resize.ts:123` → also end the drag when a move arrives with no button held; test: release outside, the drag ends.

---

### Task 02: six-presets

**Files to create:**
- `src/synth/presets.ts` — replaces `src/synth/sound.ts` (pattern). Per preset: key, name, character, scale name, lane note names, oscillator, resonance, gain, effect and mix.
- `src/mapping/notes.ts` — equal-temperament frequency of a note name, flats included.
- `src/ui/presetList.ts` — the six buttons in the instrument panel (pattern `src/ui/audioPanel.ts`).
- `src/ui/storage.ts` — guarded get and set.
- `test/presets.test.ts`, `test/notes.test.ts`.

**Files to modify:**
- `src/mapping/handToSynth.ts` — `NOTE_LANES` becomes an argument holding the current preset's lanes.
- `src/synth/engine.ts` — one voice per preset. Each has its effect and then a level glide; `setPreset` crossfades over 60 ms.
- `src/synth/snippet.ts` — rebuilds the current preset's chain.
- `src/ui/overlay.ts`, `src/ui/sliders.ts` — lane names from the current preset.
- `src/main.ts` — the current preset, its storage, and the last HandState.
- `test/mapping.test.ts`, `test/snippet.test.ts`.

**Key decisions:**
- The level glide sits after the effect, so the old preset and its tail are gone within 60 ms.
- Each preset uses only stock Gibber pieces: one oscillator (`gibber.audio.js:24096-24135`), the ladder filter, then Reverb or Delay. The snippet can then rebuild it exactly.
- First step: a browser spike with six voices and a crossfade. If the audio load or a click blocks it, stop and ask.

**Watch out for:**
- The sliders send a HandState only on input — `src/ui/sliders.ts:61-64` → re-map the last HandState when the preset changes; test: sliders still, switch preset, note and snippet change at once.
- The snippet finds the note name by frequency — `src/synth/snippet.ts:17` → name it from the current preset's lanes; test: Organ's lane 4 is named G4.
- The voice source is sent as text to the worklet — `src/synth/engine.ts:43-46` → no closures; one constructor per oscillator type; test: each preset sounds after start.
- The incoming voice must jump to its note before its level rises — `src/synth/engine.ts:162-166` keeps per-voice state; test: a recording shows no pitch sweep at a switch.
- Gibber converts Delay `time` from measures at 140 BPM — `gibber.audio.js:5268`, `5375` → the engine's Delay, in samples, uses the same conversion; test: echo spacing matches the snippet.
- The single `FULL_VOLUME` (`src/synth/sound.ts:10`) becomes a per-preset gain → measure the peak and average loudness of every preset at the brightest cutoff.

---

### Task 03: drag-to-now-playing

**Files to create:**
- `src/vendor/drag-kit/` — copies of `dragedrop.js` and its three `elements/` files at b1dec91, each with the header and its fix list.
- `src/vendor/drag-kit/dragedrop.d.ts` — types for the options and the callback. Pattern: `src/synth/gibber.d.ts`, because `tsconfig.json` has no `allowJs`.

**Files to modify:**
- `src/ui/presetList.ts` — a "Now playing" slot as the drop zone. Dropping selects through the same function as a click.
- `src/ui/styles.css` — drag and hover classes, and the slot.

**Key decisions — the listed drag-kit fixes:**
- The placeholder goes in the card's own place, not at the end of the list (`draggableElement.js:27`).
- The card's fixed width and height are reset on drop (`dragedrop.js:51-52`), so it reflows after a panel resize.
- `console.log` removed (`dragedrop.js:7`).

**Watch out for:**
- The dragged card stays under the pointer, so releasing it fires a click on it — `dragedrop.js:54-67` → ignore a card's click when the mouse moved since mousedown; test: drag out, release, the preset is unchanged.
- drag-kit and Resizer both assign `document.onmousemove` and `document.onmouseup` — `dragedrop.js:56,70`, `Resize.ts:123-124` → nothing else may; test: resize after a drag still works.

---

### Task 04: first-visit-guidance

**Files to create:**
- `src/ui/stepHints.ts` — pure next-hint rule plus its DOM: an inline SVG hand, CSS animation, and a static icon under reduced motion.
- `src/ui/statusLine.ts` — pure status words from the startup and engine status (pattern: text tables in `src/ui/cameraPanel.ts:10-23`).
- `test/stepHints.test.ts`, `test/statusLine.test.ts`.

**Files to modify:**
- `src/ui/audioPanel.ts` — a prominent class on Start until audio first starts. Try again gets the same class (today the toggle hides on failure, lines 32–33).
- `src/ui/overlay.ts` (lines 29, 146), `src/ui/cameraPanel.ts` (line 45) — hide their own "Raise your hand" and "Allow camera access to play" while a step hint shows that step.
- `src/main.ts` — feeds hints and status, and times the first second of sound.
- `src/ui/styles.css`.

**Key decisions:**
- Hints done is stored through `src/ui/storage.ts`.

**Watch out for:**
- With the sliders, no HandState arrives while the slider is still — `src/ui/sliders.ts:61-64` → time the first second with a timer started when sound begins; test: a held slider squeeze counts after 1 s.
- Hints must not block the sliders under them — `src/ui/styles.css` `.camera-status` → no pointer events on hints; test: drag a slider through a hint.

---

### Task 05: keyboard-and-help

**Files to create:**
- `src/ui/shortcuts.ts` — pure key-to-action rule plus one `keydown` listener on `window`.
- `src/ui/helpSheet.ts` — a `<dialog>` listing controls and shortcuts.
- `test/shortcuts.test.ts`.

**Files to modify:**
- `src/main.ts` — routes actions to `presetList`, the audio toggle and the layout's code toggle (Task 01).
- `src/ui/styles.css` — `:focus-visible` outlines on every control; check `--muted` on `--panel` for 4.5:1.

**Key decisions:**
- Use `event.key`, so "?" works whatever Shift needs. Ignore `event.repeat`.

**Watch out for:**
- Space on a focused button already clicks it → skip shortcuts when the target is a button, link, input or select; test: focus a preset, Space selects it and audio doesn't toggle.
- Letters typed in the gesture menu pick an option — `src/ui/sliders.ts:68-74` → no shortcuts while a select or input has focus; test: C in the menu leaves the code panel shown.

---

### Task 06: code-panel-tools

**Files to create:**
- `src/ui/highlight.ts` — pure tokenizer for comments, numbers and keywords. Keywords are the stock Gibber names the snippet calls.
- `test/highlight.test.ts`.

**Files to modify:**
- `src/ui/layout.ts` — the code panel toolbar: Copy, and a link to `https://gibber.cc/playground/` with `target=_blank` and `rel="noopener noreferrer"`, so no referrer is sent. `liveCode.show` builds spans with `textContent`, never `innerHTML`.
- `src/ui/styles.css` — token colours; keep `white-space: pre-wrap` (line 34).

**Key decisions:**
- Copy uses `navigator.clipboard.writeText` on the panel's visible text. On failure, the snippet is selected with a `Range`.

**Watch out for:**
- The panel is rewritten up to 10 times per second — `src/main.ts:45`, `src/ui/layout.ts:38` → a visitor's selection vanishes while the hand moves; pause updates while a selection lies inside the panel; test: copy fails while moving, the selection stays.
