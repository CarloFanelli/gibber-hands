---
feature: instrument-ui
version: 1.1
status: approved
base: b38d33763046b375d7bdf8ca3b23459229dbcb44
completed: true
---

# Instrument UI

## Overview

This milestone makes gibber-hands feel like an instrument a stranger can pick up. The page gets three resizable panels (camera, instrument and live code), built on the author's Resizer, with sizes remembered between visits. The instrument panel offers six **presets** with different scales. Visitors pick one by clicking it, by dragging it onto "Now playing" (built on drag-kit), or with keys 1–6. **Step hints** over the video walk a first-time visitor through camera, hand, audio and the first squeeze, then never return. Keyboard shortcuts, a help sheet, and a code panel with "Copy" and "Open gibber.cc" complete it. It's done when two of three first-time visitors make a sound within 30 seconds without help.

## Project Context

- The three panels already exist as stubs. This milestone gives them their final behaviour and look.
- Panel resizing reuses Resizer and preset dragging reuses drag-kit. The 2024 files are copied in, each with a header linking its original commit and listing every fix.
- Resizer and drag-kit handle the mouse only.
- Presets are sustained sounds only, so the squeeze and slide rules of the hand-to-sound spec apply to every preset unchanged.
- Each preset carries its own scale. The hand-to-sound spec's A minor pentatonic becomes preset 1.
- Dark theme with system fonts: no web fonts and no new runtime dependencies.
- The camera still starts on page load, and audio still starts on a click.

## Functional Requirements

### Panels

- REQ-1: The page shows three side-by-side panels (camera, instrument, live code) separated by drag handles that resize them.
- REQ-2: Panel sizes are remembered in the browser and restored on the next visit.
- REQ-3: The live code panel can be hidden and shown with a button or the C key; the other panels share its space.
- REQ-4: Below 720 px of window width, panels stack vertically (camera, instrument, code) without resize handles.

### Presets

- REQ-5: The instrument panel lists six presets, each showing its number key, name, character and scale name.
- REQ-6: A preset is selected by clicking it, dragging it onto the "Now playing" slot, or pressing its number key.
- REQ-7: Switching preset crossfades old and new sounds within 60 ms, keeping the current note lane.
- REQ-8: The six presets are those in the table below, each with its own scale, effect and effect mix.

| Key | Name | Character | Scale | Lanes 1 → 8 | Effect |
|-----|------|-----------|-------|-------------|--------|
| 1 | Saw Lead | bright sawtooth lead | A minor pentatonic | A3 C4 D4 E4 G4 A4 C5 D5 | reverb 30% |
| 2 | Warm Pad | soft, slow string pad | C major pentatonic | C4 D4 E4 G4 A4 C5 D5 E5 | reverb 60% |
| 3 | Organ | hollow square-wave organ | D dorian | D4 E4 F4 G4 A4 B4 C5 D5 | delay 25% |
| 4 | Deep Bass | round low bass | E minor pentatonic | E2 G2 A2 B2 D3 E3 G3 A3 | reverb 10% |
| 5 | Brass | brassy synth horn | F major | F3 G3 A3 B♭3 C4 D4 E4 F4 | reverb 25% |
| 6 | Blues Reed | nasal reedy lead | A blues | A3 C4 D4 E♭4 E4 G4 A4 C5 | delay 30% |

The sound details (timbre, delay time, resonance) are tuned by ear. The scales, notes, effect types and mixes are fixed.

- REQ-9: The last selected preset is restored on the next visit; a first visit starts on Saw Lead.
- REQ-10: The note lane labels on the overlay show the current preset's notes.

### Start and status

- REQ-11: Until audio starts, "Start audio" is the largest, highest-contrast control in the instrument panel.
- REQ-12: The instrument panel shows camera and audio status in words, e.g. "Camera on · Audio off".

### Step hints

- REQ-13: Step hints over the camera view show the first step not yet done: allow the camera, raise your hand, start audio, squeeze to play.
- REQ-14: Each step hint shows an animated hand icon and at most four words, and disappears once its step is done.
- REQ-15: Once the visitor has made a sound for one second, step hints stop, now and on later visits from the same browser.
- REQ-16: Pressing "?" opens a help sheet listing the controls and shortcuts; Escape or "?" closes it.

### Keyboard

- REQ-17: Shortcuts: keys 1–6 select presets, Space starts or stops audio, C hides or shows the code panel, "?" opens help.

### Live code panel

- REQ-18: A "Copy" button copies the snippet to the clipboard and shows "Copied" for 2 seconds.
- REQ-19: An "Open gibber.cc" link opens the playground in a new tab while the instrument keeps playing.
- REQ-20: The snippet shows keywords, numbers and comments in distinct colours.

## Data & Dependencies

### Information the feature must retain

- Panel sizes — saved when a resize ends, restored on load, and kept until the visitor clears site data.
- Last preset — saved on every change and restored on load.
- Hints completed — set after the first second of sound and never unset.
- Code panel visibility — per visit only, not remembered.

### External capabilities relied on

- Browser local storage — to remember the above. If it's unavailable, everything works and nothing is remembered.
- Clipboard access — for the Copy button.

## Non-Functional Requirements

- **Performance** — With all panels shown, audio on and a panel being resized, tracking still meets 25 fps on both reference laptops.
- **Validation** — In a test with 3 people who have never seen the app, at least 2 make a sound within 30 seconds without help.
- **Validation** — Every control works with the keyboard alone and shows a visible focus outline. Text contrast meets WCAG 2.2 AA (at least 4.5:1).
- **Validation** — Every preset peaks at or below −3 dBFS at full volume, and the presets' average loudness is within 3 dB of each other.
- **Validation** — The copied Resizer and drag-kit files differ from their 2024 commits only by the fixes listed in their headers.
- **Validation** — Snippet colouring uses no library, and no runtime dependency is added.
- **Validation** — Animations follow the system "reduce motion" setting.

## Edge Cases & Error Handling

| Edge Case | Expected Behavior | Relates to |
|-----------|-------------------|------------|
| Panel dragged toward zero width | Stops at the 160 px minimum | REQ-1 |
| Mouse released outside the window during a resize | Resize ends at the last position | REQ-1 |
| Window resized after a panel drag | Panels keep their proportions (one of the listed Resizer fixes) | REQ-1, REQ-2 |
| First visit, nothing saved | Camera 45%, instrument 25%, code 30% | REQ-2 |
| Saved sizes unreadable or for a different number of panels | Ignored; defaults used | REQ-2 |
| Browser storage blocked (e.g. private mode) | Defaults every visit, no error | REQ-2 |
| Code panel hidden, then page reloaded | Code panel shown again | REQ-3 |
| Code panel hidden in the stacked layout | It leaves the stack; the others keep their order | REQ-3, REQ-4 |
| Window exactly 720 px wide | Side by side | REQ-4 |
| Window crosses 720 px (phone rotated, window resized) | Layout switches without reload; saved desktop sizes untouched | REQ-4, REQ-2 |
| Instrument panel at its 160 px minimum | Names wrap; character labels hidden | REQ-5 |
| N/A — empty: the preset list is built into the page and never empty | — | REQ-5 |
| Drag released outside "Now playing" | No change; the card returns to its place | REQ-6 |
| Touch screen | Dragging unavailable; tapping a preset selects it | REQ-6 |
| Number key for the preset already selected | Nothing changes | REQ-6 |
| Preset picked before audio starts | Selected silently, used when audio starts | REQ-6 |
| Switching while silent | Instant, no crossfade needed | REQ-7 |
| Keys 1, 2, 3 pressed within 60 ms | Ends on preset 3; never two sounds at once | REQ-7 |
| Switching while a fist mutes | Stays silent | REQ-7 |
| Any preset at full volume with the brightest cutoff | Peak ≤ −3 dBFS | REQ-8 |
| Two presets compared | Average loudness within 3 dB | REQ-8 |
| N/A — network: presets are built into the page | — | REQ-8 |
| Saved preset no longer exists (renamed in an update) | Saw Lead | REQ-9 |
| Browser storage blocked | Saw Lead every visit | REQ-9 |
| Preset switched while a note plays | Labels update at once; the same lane plays the new preset's note | REQ-10 |
| Slider fallback active | The note name beside the horizontal slider uses the current preset's notes | REQ-10 |
| Audio engine failed to start | The button shows "Try again" with the same prominence | REQ-11 |
| After "Stop audio" | The button keeps its normal size | REQ-11 |
| Camera unavailable | Status reads "Sliders · Audio off" | REQ-12 |
| Audio engine failed | Status reads "Audio error" | REQ-12 |
| Camera blocked (slider fallback) | Hints become: start audio, lower the pinch slider | REQ-13 |
| Audio started before raising the hand | "Raise your hand" shows next | REQ-13 |
| Hand leaves before the first sound | The "raise your hand" hint returns | REQ-13 |
| Camera panel narrower than 320 px | Icon only, no words | REQ-14 |
| "Reduce motion" enabled | Icon shown without animation | REQ-14 |
| Browser storage blocked | Hints show on every visit until the first sound | REQ-15 |
| First sound made with the sliders | Counts as done | REQ-15 |
| Escape with the help sheet closed | Nothing happens | REQ-16 |
| "?" pressed twice quickly | Opens, then closes | REQ-16 |
| Space pressed while a button has focus | The focused button acts; the shortcut doesn't also fire | REQ-17 |
| Key held down (auto-repeat) | Acts once per press | REQ-17 |
| Keyboard layout where "?" needs Shift | Works with Shift | REQ-17 |
| Clipboard blocked or unavailable | "Copy failed — text selected"; the snippet is selected for manual copy | REQ-18 |
| Copy pressed while the snippet updates | Copies the snippet visible at that moment | REQ-18 |
| Offline | gibber.cc fails in its own tab; the instrument is unaffected | REQ-19 |
| Link clicked while playing | New tab opens; this tab keeps playing | REQ-19 |
| Snippet longer than the panel | Wraps, no horizontal scroll | REQ-20 |
| Text the colouring doesn't recognize | Default colour | REQ-20 |

## Out of Scope

- **Dragging presets on touch screens** — drag-kit is mouse-only, and tapping covers selection.
- **Resizing panels on narrow screens** — the stacked layout replaces it.
- **Picking presets with the hand** — a natural follow-up on drag-kit's geometry, but the mouse, keys and taps cover it now.
- **Struck sounds (pluck, bell)** — only sustained sounds, so the squeeze and slide rules hold for every preset.
- **User-made or editable presets** — not requested.
- **Light theme** — a dark, stage-like view keeps the hand overlay readable.
- **A mute key** — Space stops audio and the fist mutes, so a third mute would duplicate them.
- **Remembering whether the code panel is hidden** — a per-visit toggle is enough.
- **Interface languages other than English** — the audience reads the English README.

## Superseded

The ui-redesign spec replaces these requirements; the rest of this spec still holds.

- REQ-1–4: the three side-by-side panels and their stacking below 720 px give way to a top bar, the camera stage, a side panel and a floating sounds panel (ui-redesign REQ-1, REQ-10–17, REQ-27–29).
- REQ-11, REQ-12: Start audio and the status line move to the top bar (ui-redesign REQ-4, REQ-5).
- REQ-16, REQ-17: the help sheet becomes the help dialog, and the shortcuts gain S and F (ui-redesign REQ-21, REQ-32).
