---
feature: drum-loop
version: 1.0
status: approved
base: 552abfe58e22dffc0022d42a48be36e324c09ead
completed: false
---

# Drum loop

## Overview

Drum loop adds a beat to play over. The rock sign 🤟 with the **second hand** switches it to **drum mode** and starts the loop. In drum mode, moving left or right picks one of four **drum patterns**, each at its own tempo; height sets how many **drum layers** play, from kick only to the full pattern; a closed fist mutes the drums until it opens. Leaving drum mode keeps the loop going, so both hands can play notes over it. A button and the D key start and stop it. The echo follows the drum tempo, and the live code plays the same beat at gibber.cc.

## Project Context

- Builds on two-hand play's second-hand modes and on note range's gesture guide; both are specified, neither reviewed yet.
- The lead hand, the presets and every note rule stay as they are; the drums play under them.
- Drum sounds are synthesized in the browser, as the presets are: no sample downloads.
- Audio still starts only from the "Start audio" click; drums never sound before it.
- The hand model already recognises the rock sign 🤟.
- The live-code snippet must keep running unchanged at gibber.cc.
- Pattern hits and the drum mix are tuned by ear; names, tempos and layer order are fixed.
- No new runtime dependency.

## Functional Requirements

### Drum mode

- REQ-1: Showing the rock sign 🤟 with the second hand switches it to drum mode, and back to playing notes on the next sign.
- REQ-2: A Victory sign in drum mode switches straight to shape mode; a rock sign in shape mode switches straight to drum mode.
- REQ-3: In drum mode the second hand plays no note, and its note fades as for a lost hand.
- REQ-4: Switching to drum mode starts the loop if it isn't playing.

### Playing the loop

- REQ-5: In drum mode, the palm center picks the pattern: the playing zone holds the four patterns side by side, left to right, as tabled.
- REQ-6: A pattern change lands at the start of the next bar, tempo included.
- REQ-7: In drum mode, height sets the drum layers: the playing zone holds four equal bands, 1 at the bottom, 4 at the top.
- REQ-8: A layer change lands on the next beat.
- REQ-9: A closed fist in drum mode mutes the drums at once; opening it brings them back in time, as if they had kept playing.
- REQ-10: Leaving drum mode, or the second hand leaving the view, keeps the loop playing with its last pattern and layers.

| Pattern | Tempo | Feel |
|---------|-------|------|
| Rock | 110 BPM | kick, snare on 2 and 4, eighth-note hi-hats |
| House | 124 BPM | kick on every beat, off-beat open hi-hat |
| Hip-hop | 90 BPM | laid-back kick and snare, busy hi-hats |
| Breakbeat | 130 BPM | syncopated kick and snare |

| Drum layers | What plays |
|-------------|------------|
| 1 | kick |
| 2 | kick and snare |
| 3 | kick, snare and closed hi-hat |
| 4 | the full pattern, with its extra hits |

### Starting and stopping

- REQ-11: A button in the instrument panel and the D key start and stop the loop; the button reads "Start drums" or "Stop drums".
- REQ-12: A first loop of the visit starts on Rock with 4 layers.
- REQ-13: "Stop audio" stops the drums with everything else; "Start audio" brings them back only if they were playing.

### With the synth

- REQ-14: While the loop plays, the echo on Organ and Blues Reed keeps its length in beats at the drum tempo.
- REQ-15: The instrument panel shows the loop's state, pattern and tempo, e.g. "Drums: Rock · 110 BPM".

### Feedback

- REQ-16: The camera view labels the second hand's drum mode, and in it the pattern under the hand and its layers, e.g. "Rock 3/4".
- REQ-17: While the drums sound, the live code sets the tempo and plays the same pattern and layers, and still runs unchanged at gibber.cc.
- REQ-18: The gesture guide and the help sheet describe the rock sign, drum mode and the D key.

### Without a camera

- REQ-19: Without a camera, the sliders add a pattern choice and a drum layers slider; the button and the D key start the loop.

## Data & Dependencies

### Information the feature must retain

- Loop state, pattern and layers — per visit only; a reload starts with the drums stopped.
- Second hand's mode — per visit only, as in two-hand play; drum mode joins notes and shape mode.

### External capabilities relied on

- Hand tracking that recognises the rock sign 🤟 on each hand — the hand model already used.
- Gibber's synthesized drums and its clock, which the live code uses at gibber.cc.

## Non-Functional Requirements

- **Performance** — With the loop at 4 layers and two hands moving, tracking runs at ≥ 25 fps on both reference laptops (i5-1240P Windows, M1 Pro macOS, current Chrome).
- **Performance** — Drum hits stay on the beat whatever tracking does: over 5 minutes, no hit drifts from the tempo's grid by more than 1 ms.
- **Validation** — The loop at 4 layers plus two hands at full squeeze, brightest, octave raised, peaks at or below −3 dBFS on every preset and pattern.
- **Validation** — Muting, unmuting, pattern, layer and tempo changes make no click.
- **Validation** — With a real hand, at least 19 of 20 rock signs by the second hand switch its mode, and no other gesture switches it in 2 minutes of playing.
- **Security** — No new network requests; video still never leaves the device.

## Edge Cases & Error Handling

| Edge Case | Expected Behavior | Relates to |
|-----------|-------------------|------------|
| Rock sign with the lead hand | Nothing switches | REQ-1 |
| Rock sign held | One switch; switching again needs the sign dropped and shown again | REQ-1 |
| Rock sign seen for less than the gesture label's confirmation time | No switch | REQ-1 |
| The second hand leaves in drum mode and returns | Still in drum mode | REQ-1, REQ-10 |
| Page reloaded | The second hand plays notes again; the drums are stopped | REQ-1, REQ-12 |
| Roles swapped while in drum mode | The new second hand plays notes; the loop keeps playing | REQ-1, REQ-10 |
| Victory sign in drum mode | Shape mode; the loop keeps playing | REQ-2 |
| Rock sign in shape mode while the octave is raised | Drum mode; notes return to the normal octave at once, the effect glides back to the preset's amount | REQ-2 |
| Switch to drum mode while the second hand's note sounds | Its note fades within 100 ms | REQ-3 |
| Squeeze in drum mode | No note; only the fist mutes | REQ-3, REQ-9 |
| Switch to drum mode before "Start audio" | The mode switches; the loop starts with the audio | REQ-4, REQ-13 |
| Switch to drum mode while the loop plays | The loop goes on; the hand takes over pattern and layers from where it is | REQ-4 |
| Palm center left of the playing zone | Rock | REQ-5 |
| Palm center right of the playing zone | Breakbeat | REQ-5 |
| Palm center on a pattern border | The pattern holds until the palm center is 20% of a pattern's width past it, as lanes do | REQ-5 |
| Hand crosses two patterns within one bar | Only the pattern under the hand at the bar's start plays | REQ-6 |
| Tempo change while the echo rings | The echo's time follows at the bar start, without a click | REQ-6, REQ-14 |
| Hand above or below the playing zone | 4 or 1 layers | REQ-7 |
| Hand on a layer border | The layers hold until the hand is 20% of a band past it | REQ-7 |
| Hand sweeps from bottom to top within one beat | The next beat plays 4 layers | REQ-8 |
| Layers changed while muted | The new layers come back with the drums | REQ-8, REQ-9 |
| Fist while the loop is stopped | Nothing sounds; the loop stays stopped | REQ-9 |
| Fist, then the hand leaves the view | The mute ends; the drums come back in time | REQ-9, REQ-10 |
| Fist held across a bar start | Muted bars stay silent; the pattern under the hand is the one that comes back | REQ-6, REQ-9 |
| No hand in view, loop playing | The loop goes on unchanged | REQ-10 |
| Two hands play notes over the loop | The loop goes on; both notes sound over it | REQ-10 |
| D key while the help sheet is open | Ignored, as the other shortcuts are | REQ-11 |
| D key while typing in a field | Ignored | REQ-11 |
| "Stop drums" while the second hand is in drum mode | The loop stops, and the second hand goes back to playing notes | REQ-1, REQ-11 |
| Keyboard only | The button is reachable with Tab, with a focus outline | REQ-11 |
| Loop started from the button | Rock, 4 layers, or the last pattern and layers of this visit | REQ-11, REQ-12 |
| Audio stopped while muted | The mute ends; "Start audio" brings the drums back unmuted if they were playing | REQ-9, REQ-13 |
| Audio engine fails to start | The drums stay stopped, and the existing audio error says why | REQ-13 |
| A preset without echo | Nothing follows the tempo; the preset sounds as today | REQ-14 |
| Loop stopped | The echo returns to today's timing at once, without a click | REQ-14 |
| Loop stopped | The panel reads "Drums off" | REQ-15 |
| Loop muted | The panel reads "Drums: Rock · 110 BPM · muted" | REQ-15 |
| Second hand leaves in drum mode | Its labels go with it; the loop plays on | REQ-16 |
| Camera panel narrower than 560 px | The drum labels shrink to their icons, as the other hand labels do | REQ-16 |
| Loop stopped, or muted | The live code leaves the drums out | REQ-17 |
| Snippet copied with Hip-hop at 2 layers | Pasted at gibber.cc, it plays kick and snare at 90 BPM, with the notes over it | REQ-17 |
| Roles swapped | The guide and the help sheet name the right hand as the one showing the rock sign | REQ-18 |
| N/A — empty and concurrent: the guide and help sheet are fixed text | — | REQ-18 |
| No camera: pattern set to House, layers at 2 | Plays House's kick and snare at 124 BPM | REQ-19 |
| No camera: Keyboard only | The pattern choice and the layers slider are reachable with Tab and the arrow keys | REQ-19 |
| N/A — network: drums are synthesized on the device; no sample downloads | — | REQ-4, REQ-11 |

## Out of Scope

- **Drum pads played by hand** — every hit would land about a tenth of a second late; the loop keeps its own time.
- **Editing patterns, or more than four** — four fixed patterns keep drum mode learnable; editing beats belongs to live coding at gibber.cc.
- **A tempo control** — each pattern's own tempo suits it; picking a pattern picks a tempo.
- **Drawing the pattern zones on the camera view** — they would cover the note lanes; the hand label names the pattern under it.
- **A light that pulses on the beat** — the sound already carries the beat; possible later.
- **Remembering the loop between visits** — a visit starts quiet, as a newcomer expects; audio never autoplays.
- **Sample-based drum kits** — they need downloads; synthesized drums keep everything on the device.
- **Syncing the synth's notes to the beat** — notes stay free, played by the hands.
