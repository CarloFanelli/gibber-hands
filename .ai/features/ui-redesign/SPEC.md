---
feature: ui-redesign
version: 1.0
status: approved
base: bea553e90295e9bca68c7aab6a42ab4dae810f64
completed: false
---

# UI Redesign

## Overview

Today the page shows every control at the same weight in three columns, so nothing stands out. This feature puts the camera at the centre and gives the controls a clear hierarchy. A slim **top bar** holds what must always be reachable: Start audio, status, left-handed and Help. A collapsible **side panel** on the right holds the live code and the **gesture guide** in two tabs. A floating **sounds panel** with presets and drums can be dragged anywhere and shrunk to an icon. A **welcome dialog** starts audio in one click, and a **help dialog** lists controls and keys. On phones, the panels become **bottom sheets**. It's done when 3 of 3 first-time visitors make a sound within 20 s.

## Project Context

- Supersedes these earlier requirements. instrument-ui: REQ-1–4, 11, 12, 16, 17. note-range: REQ-11, 13–15. two-hand-play: REQ-3, 15. drum-loop: REQ-1, 11 (placement only). Those specs get a version bump before the code changes.
- Sound, gestures, presets, drums and live-code content are unchanged. Only where and how they appear changes.
- Panel resizing keeps using Resizer and preset dragging keeps using drag-kit. Both are mouse-only, and only minimal, logged fixes are allowed.
- No request may send visitor data, so fonts are system fonts or ship with the site.
- The camera is still requested on page load. Audio still starts only from a click or key press.
- Hand tracking must keep ≥ 25 fps on both reference laptops.

## Functional Requirements

### Layout

- REQ-1: The page has three areas: a top bar across the full width, the stage holding the camera, and the side panel on the right.
- REQ-2: The camera picture stays whole and centred in the stage, resizing as the side panel opens, closes or is resized.
- REQ-3: Without a camera, the sliders take the camera picture's place in the stage.

### Top bar

- REQ-4: The top bar, always visible, shows the name, Start/Stop audio, camera and audio status in words, the left-handed switch and a Help button.
- REQ-5: Until audio starts, Start audio is the largest, highest-contrast control on the page, outside the welcome dialog.
- REQ-6: The top bar shows "Video stays on your device" next to the camera status.

### Side panel

- REQ-7: The side panel has two tabs, Code and Gestures, and the selected one fills the panel's full height.
- REQ-8: The Code tab shows the live code with its Copy and Open gibber.cc controls, both behaving as today.
- REQ-9: The Gestures tab shows the gesture guide, naming each hand by role and side and following the left-handed swap.
- REQ-10: A button on the side panel and the C key collapse it to a narrow strip with an expand button, and expand it again.
- REQ-11: Dragging the side panel's left edge resizes it, between 280 px and half the window's width.
- REQ-12: A first visit opens the side panel on the Code tab at 360 px wide. Later visits restore its width, open state and tab.

### Sounds panel

- REQ-13: The sounds panel floats over the stage and holds the six preset cards, "Now playing" and the drum controls.
- REQ-14: Dragging the sounds panel's title bar moves it anywhere below the top bar, always fully inside the window.
- REQ-15: A title-bar button and the S key shrink the sounds panel to an icon in the same place. The icon or S restores it.
- REQ-16: A first visit opens the sounds panel in the stage's bottom-left corner. Later visits restore its position and its open or icon state.
- REQ-17: A preset is selected by clicking its card, pressing its number key, or dragging the card onto "Now playing". A card drag never moves the panel.

### Welcome dialog

- REQ-18: Every visit opens the welcome dialog, which says in one sentence what the page does, until the visitor has made a sound for one second.
- REQ-19: The welcome dialog's "Start playing" button starts audio and closes the dialog with one click.
- REQ-20: The close button, Escape or a click outside closes the welcome dialog without starting audio, and the step hints guide as before.

### Help dialog

- REQ-21: The Help button or "?" opens the help dialog, which lists every button and keyboard shortcut. Escape, "?" or its close button closes it.
- REQ-22: The help dialog's "Show gestures" link closes it and opens the side panel on the Gestures tab.
- REQ-23: While a dialog is open, keyboard focus stays inside it. Closing it returns focus to the control that opened it.

### Camera overlay

- REQ-24: Each tracked hand carries a hand tag beside it with its role and gesture. A second hand in shape mode also shows the octave and the effect amount.
- REQ-25: During play, nothing else covers the camera picture except the note lanes and their labels, the hand tags and the step hints.
- REQ-26: The F key shows or hides an fps counter in a corner of the stage. It starts hidden on every visit.

### Narrow windows

- REQ-27: Below 720 px of window width, the stage fills the space under the top bar, and a bottom bar offers "Sounds" and "Code & gestures" buttons.
- REQ-28: Each bottom-bar button opens its panel as a bottom sheet. Only one sheet is open at a time, and its × or a tap on the stage closes it.
- REQ-29: Below 720 px, panels neither move nor resize, and presets are selected by tapping their card.

### Look and keys

- REQ-30: Bars, panels and dialogs use solid dark surfaces, one accent colour and a monospace font for numbers and code. All text contrast is ≥ 4.5:1.
- REQ-31: The page has a favicon, and loading the page logs no "not found" error for it.
- REQ-32: Shortcuts: 1–6 select a preset, Space starts or stops audio, D the drums, C the side panel, S the sounds panel, F the fps counter, "?" help.

## Data & Dependencies

### Information the feature must retain

- Side panel layout: width, open or collapsed, selected tab. Saved on each change, restored on later visits in the same browser.
- Sounds panel layout: position, and whether it's open or an icon. Same lifecycle.
- First-sound flag: the existing step-hint flag also retires the welcome dialog. Set once, never cleared by the page.
- Kept unchanged: last preset and the left-handed choice.

## Non-Functional Requirements

- **Performance** — Hand tracking holds ≥ 25 fps on both reference laptops with the side panel open and the sounds panel open over the camera.
- **Performance** — Opening or closing a panel, sheet or dialog finishes within 200 ms and causes no audible glitch.
- **Security** — The redesign adds no network request beyond the existing ones (page files, the MediaPipe model, Gibber).
- **Validation** — 3 of 3 first-time visitors on a reference laptop make a sound within 20 s and switch preset within 60 s, without help.
- **Validation** — Every control can be reached and operated with the keyboard alone, and each dialog announces its title to screen readers.

## Edge Cases & Error Handling

| Edge Case | Expected Behavior | Relates to |
|-----------|-------------------|------------|
| Window exactly 720 px wide | The desktop layout applies. Sheets start at 719 px | REQ-1, REQ-27 |
| Side panel at its widest leaves the stage narrower than 8 note lanes | The playing zone keeps 8 note lanes, narrower ones, as in the note-range spec | REQ-2 |
| Camera denied or missing | The sliders fill the stage and the top bar says why in words, e.g. "Camera blocked" | REQ-3, REQ-4 |
| Camera unplugged mid-play | The status turns "Camera lost" and the sliders take its place, as today | REQ-3 |
| Audio fails to start (Gibber fails to load) | The top bar says "Audio failed" with the reason, the welcome dialog closes, and Start offers to retry | REQ-4, REQ-19 |
| Space pressed while Start audio has focus | Audio toggles once, not twice | REQ-5, REQ-32 |
| Top bar on a 720–900 px window | Status words shorten to icons, with the words as tooltip and screen-reader label; nothing wraps to a second line | REQ-4, REQ-6 |
| N/A — concurrent: the privacy note is static text | — | REQ-6 |
| Side panel collapsed while the live code updates | Updates continue unseen, and expanding shows the current code | REQ-8, REQ-10 |
| Copy denied by the browser | Copy shows "Copy failed" for 2 s instead of "Copied" | REQ-8 |
| Left-handed switched while the Gestures tab is shown | The guide relabels the hands at once | REQ-9 |
| C pressed while typing in a slider field | The key goes to the field, and the panel doesn't toggle (existing focus rule) | REQ-10, REQ-32 |
| Drag past 280 px or half the window | The width stops at the limit | REQ-11 |
| Saved width now wider than half the window (smaller screen) | It is clamped to half the window, and the saved value is kept for wider windows | REQ-12 |
| Saved layout unreadable or missing (cleared or private mode) | First-visit layout, with no error shown | REQ-12, REQ-16 |
| Window shrinks and leaves the sounds panel partly off-screen | The panel slides back fully inside the window | REQ-14 |
| Sounds panel dragged over the side panel | It is stopped at the side panel's edge and never covers the side panel | REQ-14 |
| Touch-only screen ≥ 720 px (tablet) | The sounds panel stays put but still shrinks to an icon. The side panel collapses but doesn't resize | REQ-14, REQ-11 |
| S pressed while a preset card is mid-drag | The drag is cancelled, then the panel shrinks | REQ-15, REQ-17 |
| Sounds panel shrunk to an icon | Number keys still select presets, and "Now playing" stays readable in the icon's tooltip | REQ-15, REQ-17 |
| Saved position off-screen on a smaller window | The panel is placed at the nearest in-window spot | REQ-16 |
| Preset card dropped outside "Now playing" | Nothing changes, and the card returns to the list | REQ-17 |
| Number key pressed before audio starts | The preset is selected and plays once audio starts, as today | REQ-17 |
| Visitor already made a sound on an earlier visit | No welcome dialog and no step hints | REQ-18 |
| Visitor makes a sound for 1 s while the dialog is closed | The flag is set, and the dialog never shows again | REQ-18 |
| Camera permission prompt and welcome dialog at the same time | Both show. "Start playing" works whatever the camera answer is | REQ-19 |
| "Start playing" double-clicked | Audio starts once, and the second click does nothing | REQ-19 |
| Welcome closed without playing | The "start audio" step hint points at the top-bar button | REQ-20 |
| "?" pressed while the welcome dialog is open | The welcome closes and help opens. Only one dialog at a time | REQ-21, REQ-23 |
| Shortcuts while a dialog is open | Only Escape and "?" act. Other keys do nothing | REQ-23, REQ-32 |
| "Show gestures" while the side panel is collapsed | The side panel expands on the Gestures tab | REQ-22 |
| "Show gestures" below 720 px | The "Code & gestures" sheet opens on the Gestures tab | REQ-22, REQ-28 |
| Opener no longer visible when a dialog closes | Focus goes to Start audio | REQ-23 |
| Hand at the picture's edge | The hand tag stays fully inside the picture, on the side away from the edge | REQ-24 |
| Two hands overlapping | The tags stack and never cover each other | REQ-24 |
| No hand in view | No tags. The step hint shows if still due | REQ-24, REQ-25 |
| Sounds panel open over the camera | It's the visitor's choice and allowed. Tags and lanes under it are hidden by it | REQ-25 |
| F before tracking has started | The counter shows "— fps" until the first frame | REQ-26 |
| Rotating a phone across 720 px | The layout switches, and an open sheet closes | REQ-27, REQ-28 |
| One sheet open when the other button is tapped | The first closes and the second opens | REQ-28 |
| Contrast over the camera (hand tags, lane labels) | They have a solid dark background, so contrast holds over any video | REQ-30 |
| Favicon file fails to load | The browser's default icon shows, and the page works | REQ-31 |
| N/A — permission, network: shortcuts are local key handling | — | REQ-32 |

## Out of Scope

- **Touch dragging on tablets** — Resizer and drag-kit are mouse-only, and rewriting them is ruled out.
- **Light theme** — one dark theme halves the contrast work and the testing.
- **Resizing the sounds panel** — its content has a fixed size, and nobody asked for it.
- **Keyboard moving of the sounds panel** — every control inside it is already keyboard-reachable, and its position is cosmetic.
- **"Reset layout" control** — clearing site data already restores the first-visit layout.
- **Editing the code in the page** — a separate feature with its own risks.
