---
feature: note-range
version: 1.1
status: approved
base: 552abfe58e22dffc0022d42a48be36e324c09ead
completed: false
---

# Note range

## Overview

Note range gives the player more notes, and a guide to playing them. Widening the camera picture adds **note lanes**: one per 80 px of **playing zone**, from 8 up to 16, carrying on the **preset**'s scale above its top note. In **shape mode**, holding a thumbs-down with the **second hand** plays every note an octave lower, as the squeeze plays them higher. Below the live code, in the same column, a gesture guide lists every gesture; a draggable divider sets how the two share the column, and "Hide code" now hides only the code. On a laptop with today's layout, the lanes stay at 8 until the player widens the camera panel.

## Project Context

- Builds on two-hand play: shape mode and the octave squeeze stay as they are. That feature is built but not yet reviewed.
- Replaces the fixed 8 lanes of the hand-to-sound and instrument-ui specs; lanes 1–8 keep their notes.
- Replaces instrument-ui's rule that hiding the code hides its whole panel: the panel stays, holding the guide.
- The camera picture keeps its shape in the camera panel; a panel wider than that shape shows black bars.
- A wider picture doesn't widen what the camera sees: more lanes means narrower lanes for the hand.
- The 80 px lane width is a starting value, changed under the tuned-by-ear rule; lane hysteresis stays 20% of a lane.
- The new divider looks and works like the bars between panels: drag, arrow keys, size remembered.
- The live-code snippet must keep running unchanged at gibber.cc. No new runtime dependency: the hand model already recognises the thumbs-down.

## Functional Requirements

### More note lanes

- REQ-1: The playing zone holds one note lane per 80 CSS px of its on-screen width, rounded down, never fewer than 8 or more than 16.
- REQ-2: Only the camera picture's own width counts: black bars beside it in a wider panel add no lanes.
- REQ-3: The lane count follows the picture as it resizes, while a panel divider is dragged or the window changes size.
- REQ-4: Lanes 1–8 keep each preset's notes; each extra lane plays the next note of the preset's scale, as in the table below.
- REQ-5: The overlay draws every lane, extra ones included, with its note name, and lights the lanes being played.

| Preset | Scale | Lanes 9 → 16 |
|--------|-------|--------------|
| Saw Lead | A minor pentatonic | E5 G5 A5 C6 D6 E6 G6 A6 |
| Warm Pad | C major pentatonic | G5 A5 C6 D6 E6 G6 A6 C7 |
| Organ | D dorian | E5 F5 G5 A5 B5 C6 D6 E6 |
| Deep Bass | E minor pentatonic | B3 D4 E4 G4 A4 B4 D5 E5 |
| Brass | F major | G4 A4 B♭4 C5 D5 E5 F5 G5 |
| Blues Reed | A blues | D5 E♭5 E5 G5 A5 C6 D6 E♭6 |

With fewer than 16 lanes, the extra lanes are the first ones of the row: 11 lanes on Saw Lead add E5 G5 A5.

### Octave down

- REQ-6: In shape mode, holding a thumbs-down with the second hand plays every note one octave lower; dropping the sign brings them back at once.
- REQ-7: While the octave is lowered, brightness halves with it, so lower notes sound as bright as the same lane in the normal octave.
- REQ-8: While lowered, the camera view labels the shaping hand "Octave down", and the lane labels name the lower notes.
- REQ-9: The live code shows the lowered notes and still runs unchanged at gibber.cc.

### Without a camera

- REQ-10: Without a camera, the sliders' "Octave up" switch becomes an Octave choice of Down, Normal or Up.

### Gesture guide

- REQ-11: Below the live code, in the same panel, a gesture guide lists every gesture in the table below and what it does.
- REQ-12: The guide names each hand by its role and side, following the lead-hand swap.
- REQ-13: A divider between code and guide moves by dragging, or with the up and down arrow keys once focused.
- REQ-14: The divider's position is remembered between visits; a first visit splits the panel half and half.
- REQ-15: "Hide code" and the C key hide only the code; the guide then fills the panel. "Show code" restores the split.
- REQ-16: The help sheet describes the thumbs-down, the wider picture's extra lanes, and the divider's arrow keys.

| Gesture | What it does |
|---------|--------------|
| Palm center left or right | Picks the note, one note lane each; a wider camera picture gives more lanes |
| Palm center up or down | Brighter or darker |
| Thumb and index squeezed | Plays the note: the closer, the louder |
| Closed fist | Silence |
| Second hand: Victory sign ✌ | Switches it between playing notes and shape mode |
| Shape mode: squeeze held | Every note one octave up |
| Shape mode: thumbs-down held 👎 | Every note one octave down |
| Shape mode: hand up or down | More or less reverb or echo |

## Data & Dependencies

### Information the feature must retain

- Code and guide split — set by the divider; kept until the visitor clears site data. A first visit, or a saved value that can't be read, gets half and half.
- Code hidden — per visit only, as today.
- The lane count comes from the panel sizes, already remembered; the lowered octave lasts only while the sign is held.

### External capabilities relied on

- Browser local storage — to remember the split. If it's unavailable, everything works and nothing is remembered.
- Hand tracking that recognises the thumbs-down on each hand — the hand model already used.

## Non-Functional Requirements

- **Performance** — With two hands moving, 16 lanes and audio on, tracking runs at ≥ 25 fps on both reference laptops (i5-1240P Windows, M1 Pro macOS, current Chrome).
- **Performance** — The octave drops on the first tracked frame where the gesture label shows the thumbs-down, with no added smoothing.
- **Validation** — Two hands at full squeeze on every preset's highest and lowest lanes, in the raised and the lowered octave, peak at or below −3 dBFS.
- **Validation** — Octave drops and lane-count changes make no click.
- **Validation** — With a real hand, at least 19 of 20 thumbs-down signs by the shaping hand lower the octave, and no other gesture lowers it in 2 minutes of playing.
- **Validation** — With a real hand held still on a lane border, the note doesn't flicker at 8, 12 or 16 lanes.
- **Security** — No new network requests; video still never leaves the device.

## Edge Cases & Error Handling

| Edge Case | Expected Behavior | Relates to |
|-----------|-------------------|------------|
| Playing zone 719 px wide, then 720 px | 8 lanes, then 9 | REQ-1 |
| Playing zone 1280 px wide or more | 16 lanes | REQ-1 |
| Playing zone under 640 px (a phone, stacked panels) | 8 lanes, each narrower than 80 px, as today | REQ-1 |
| Browser zoomed out | The picture spans more CSS px, so more lanes, as on a bigger screen | REQ-1 |
| No picture yet (camera loading, denied or missing) | 8 lanes | REQ-1 |
| N/A — network: the lane count is worked out on the device | — | REQ-1 |
| Panel wider than the picture's shape | Black bars at the sides; the count follows the picture's width only | REQ-2 |
| Panel taller than the picture's shape | The picture fills the panel's width; the count follows it | REQ-2 |
| Divider dragged while a note sounds | The lane now under the palm center plays; a new note glides in, as on any lane change | REQ-3 |
| Count changes while no hand is in view | Nothing sounds; the next hand plays the lane under its palm center | REQ-3 |
| Palm center near a border after the count changes | The current lane holds until the palm center is 20% of a lane past its border, as today | REQ-3 |
| Page reloaded | The panel sizes come back, and the lane count with them | REQ-3 |
| Two hands | Both play the same lanes | REQ-3, REQ-4 |
| Preset switched with 12 lanes | Every lane names the new preset's note at once; the sounding notes crossfade within 60 ms | REQ-4 |
| Highest note raised (Warm Pad lane 16, C7 to C8) | Plays; the peak limit holds | REQ-4 |
| Note names with 16 lanes | Every lane is at least 80 px wide, so every name fits | REQ-5 |
| Camera panel narrower than 320 px | Lanes drawn without names, as today | REQ-5 |
| Thumbs-down seen for less than the gesture label's confirmation time | No change | REQ-6 |
| Thumbs-down with the lead hand, or with the second hand playing notes | No octave change | REQ-6 |
| Squeeze straight into a thumbs-down | The notes drop two octaves at once; an octave never slides | REQ-6 |
| Thumbs-down while no note sounds | Nothing sounds; the next note starts in the lower octave | REQ-6 |
| Shaping hand leaves, or a Victory sign switches it back, while lowered | Notes return to the normal octave at once | REQ-6 |
| Height changes while the thumbs-down is held | The effect amount follows it, as in shape mode | REQ-6 |
| Lowest note lowered (Deep Bass, E2 to E1, 41 Hz) | Plays; laptop speakers barely reproduce it, headphones do; the peak limit holds | REQ-6 |
| Darkest brightness, octave lowered | Averaged over lanes 1–8, the lower octave is within 5 dB of the normal octave | REQ-7 |
| Brightest, octave lowered | Brightness reaches 3,200 Hz | REQ-7 |
| Lowered with 16 lanes | The lane labels name all 16 lower notes | REQ-8 |
| Camera panel narrower than 560 px | The label shrinks to its icon, "↓", as the other hand labels do | REQ-8 |
| Snippet copied with the octave lowered | Pasted at gibber.cc, it plays the same notes | REQ-9 |
| No note sounding | The snippet is as today: silent, with the line that makes it sound | REQ-9 |
| No camera: Octave set to Down, pinch slider at full | Plays the lower octave | REQ-10 |
| No camera: lane count | Always 8; the sliders have no picture to widen | REQ-1, REQ-10 |
| Keyboard only | The Octave choice is reachable with Tab and the arrow keys, with focus outlines | REQ-10 |
| No camera (sliders) | The guide stays, with a first line saying the sliders stand in for the hand without a camera | REQ-11 |
| Guide taller than its part of the panel | The guide scrolls on its own; the code stays in place | REQ-11 |
| N/A — network and integrity: the guide is fixed text in the page | — | REQ-11 |
| Roles swapped | The guide names the left hand as the lead hand and the right hand as the second hand | REQ-12 |
| Roles swapped while the guide is in view | The names change at once | REQ-12 |
| Divider dragged to the top or bottom | It stops where the code or the guide reaches 120 px | REQ-13 |
| Panel shorter than 240 px (stacked panels on a phone) | No divider; code and guide each take half and scroll on their own | REQ-13 |
| Keyboard only | Tab reaches the divider, with a focus outline; each arrow press moves it 24 px, as the bars between panels do | REQ-13 |
| Screen reader | The divider is announced as a separator between code and guide, with its position | REQ-13 |
| Window resized | Code and guide keep their share of the panel's height | REQ-14 |
| Page reloaded | The saved split comes back | REQ-14 |
| Browser storage blocked, or the saved split unreadable | Half and half; dragging still works, for that visit | REQ-14 |
| Code hidden | The guide fills the panel and the divider hides; the panel keeps its width, and the bars beside it still resize it | REQ-15 |
| Code shown again | The split returns where it was | REQ-15 |
| Code hidden while its Copy button has focus | Focus moves to the "Show code" button, as today | REQ-15 |
| Page reloaded with the code hidden | The code shows again, as today | REQ-15 |
| Roles swapped | The help sheet names the right hand as the one showing the thumbs-down | REQ-16 |
| N/A — empty and concurrent: the help sheet is fixed text | — | REQ-16 |

## Out of Scope

- **A lane-count setting in the instrument panel** — the camera picture's width is the control the player asked for.
- **More than 16 lanes** — narrower lanes, about 5% of what the camera sees, get hard to hit with a real hand.
- **Extra notes below each preset's lowest note** — the bass presets would go below what laptop speakers play.
- **More lanes on the sliders** — there is no picture to widen; the note slider keeps the 8 lanes.
- **Two octaves up or down** — one octave each way covers the stated need.
- **A step hint for the thumbs-down or the wider picture** — the gesture guide and the help sheet cover both; step hints stay for first steps.
- **A guide that lights the gesture being shown** — the camera view's labels already show each hand's gesture.
- **Hiding the whole code panel** — the guide is worth keeping in view for players who don't read code.
- **Drums and rhythm** — the next spec, with its own interview.
