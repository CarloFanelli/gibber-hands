---
feature: drum-loop
version: 2.0
status: approved
base: 552abfe58e22dffc0022d42a48be36e324c09ead
completed: true
---

# Drum loop

## Overview

Drum loop adds a beat to play over. Buttons in the instrument panel start and stop it, step through four **drum patterns**, each at its own tempo, and add or remove **drum layers**, from kick only to the full pattern. Both hands keep playing notes over it, as before. The D key starts and stops it too. The echo follows the drum tempo, and the live code plays the same beat at gibber.cc.

## Project Context

- Version 2.0 drops drum mode: in 1.x a rock sign 🤟 switched the second hand to steering the drums (palm left–right for the pattern, height for the layers, a fist to mute). Played, changing the beat by hand didn't work; buttons replace it.
- The hands, the presets and every note rule stay as they are; the drums play under them.
- Drum sounds are synthesized in the browser, as the presets are: no sample downloads.
- Audio still starts only from the "Start audio" click; drums never sound before it.
- The live-code snippet must keep running unchanged at gibber.cc.
- Pattern hits and the drum mix are tuned by ear; names, tempos and layer order are fixed.
- No new runtime dependency.

## Functional Requirements

### Starting and stopping

- REQ-1: A button in the instrument panel and the D key start and stop the loop; the button reads "Start drums" or "Stop drums".
- REQ-2: A first loop of the visit starts on Rock with 4 drum layers.
- REQ-3: "Stop audio" stops the drums with everything else; "Start audio" brings them back only if they were playing.

### Choosing the beat

- REQ-4: Two arrow buttons beside the start button step to the previous and the next drum pattern, in the table's order, wrapping from Breakbeat to Rock and back.
- REQ-5: A pattern change lands at the start of the next bar, tempo included.
- REQ-6: Two buttons, − and +, remove or add one drum layer, between 1 and 4.
- REQ-7: A layer change lands on the next beat.
- REQ-8: The arrows and the − and + buttons work while the loop is stopped too; the next start plays what they chose.

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

### The hands

- REQ-9: No gesture starts, stops or changes the drums: the hands play notes and shape them as before, over the loop.

### With the synth

- REQ-10: While the loop plays, the echo on Organ and Blues Reed keeps its length in beats at the drum tempo.
- REQ-11: The instrument panel shows the loop's state, the pattern chosen, its tempo and the drum layers, e.g. "Drums: Rock · 110 BPM · layers 3/4", or "Drums off · Rock · 110 BPM · layers 3/4" while stopped.

### Feedback

- REQ-12: While the drums sound, the live code sets the tempo and plays the same pattern and layers, and still runs unchanged at gibber.cc.
- REQ-13: The help sheet describes the drum buttons and the D key.

## Data & Dependencies

### Information the feature must retain

- Loop state, pattern and layers — per visit only; a reload starts with the drums stopped.

### External capabilities relied on

- Gibber's synthesized drums and its clock, which the live code uses at gibber.cc.

## Non-Functional Requirements

- **Performance** — With the loop at 4 layers and two hands moving, tracking runs at ≥ 25 fps on both reference laptops (i5-1240P Windows, M1 Pro macOS, current Chrome).
- **Performance** — Drum hits stay on the beat whatever tracking does: over 5 minutes, no hit drifts from the tempo's grid by more than 1 ms.
- **Validation** — The loop at 4 layers plus two hands at full squeeze, brightest, octave raised, peaks at or below −3 dBFS on every preset and pattern.
- **Validation** — Pattern, layer and tempo changes make no click.
- **Security** — No new network requests; video still never leaves the device.

## Edge Cases & Error Handling

| Edge Case | Expected Behavior | Relates to |
|-----------|-------------------|------------|
| Page reloaded | The drums are stopped; the next start plays Rock with 4 layers | REQ-2 |
| D key while the help sheet is open | Starts or stops the drums, as 1–6 and C act while it is open | REQ-1 |
| D key while typing in a field | Ignored | REQ-1 |
| Keyboard only | The five drum buttons are reachable with Tab, with a focus outline; a screen reader names the arrows "Previous drum pattern" and "Next drum pattern", and − and + "Fewer drum layers" and "More drum layers" | REQ-1, REQ-4, REQ-6 |
| Audio engine fails to start | The drums stay stopped, the drum buttons are disabled, and the existing audio error says why | REQ-3 |
| Next pattern after Breakbeat | Rock | REQ-4 |
| Previous pattern before Rock | Breakbeat | REQ-4 |
| Arrow pressed several times within one bar | Only the last pattern chosen plays, from the next bar | REQ-4, REQ-5 |
| Pattern chosen while the loop plays | The panel names it at once; it is heard from the next bar | REQ-5, REQ-11 |
| Tempo change while the echo rings | The echo's time follows at the bar start, without a click | REQ-5, REQ-10 |
| − at 1 layer, or + at 4 layers | That button is disabled | REQ-6 |
| Layers changed several times within one beat | The next beat plays the last count | REQ-7 |
| Arrows, − or + while the loop is stopped, or before "Start audio" | Nothing sounds; the panel shows the choice; the next start plays it | REQ-8 |
| Rock sign by either hand | Nothing about the drums changes; the hand plays as before | REQ-9 |
| Closed fist while the drums play | That hand's note goes silent; the drums go on | REQ-9 |
| No hand in view, loop playing | The loop goes on unchanged | REQ-9 |
| A preset without echo | Nothing follows the tempo; the preset sounds as today | REQ-10 |
| Loop stopped | The echo returns to today's timing at once, without a click | REQ-10 |
| Loop stopped | The live code leaves the drums out | REQ-12 |
| Snippet copied with Hip-hop at 2 layers | Pasted at gibber.cc, it plays kick and snare at 90 BPM, with the notes over it | REQ-12 |
| No camera | The drum buttons and the D key work as with one | REQ-1, REQ-4, REQ-6 |
| N/A — network: drums are synthesized on the device; no sample downloads | — | REQ-1 |

## Out of Scope

- **Changing the drums by hand** — tried in 1.x (a rock sign for drum mode, the palm choosing pattern and layers, a fist muting): changing the beat by hand didn't work when played; buttons are steadier.
- **A drum mute** — it came with drum mode; "Stop drums" ends the beat.
- **Keys for patterns and layers** — the buttons do it; the D key stays for start and stop.
- **Drum pads played by hand** — every hit would land about a tenth of a second late; the loop keeps its own time.
- **Editing patterns, or more than four** — four fixed patterns keep the buttons quick to step through; editing beats belongs to live coding at gibber.cc.
- **A tempo control** — each pattern's own tempo suits it; picking a pattern picks a tempo.
- **A light that pulses on the beat** — the sound already carries the beat; possible later.
- **Remembering the loop between visits** — a visit starts quiet, as a newcomer expects; audio never autoplays.
- **Sample-based drum kits** — they need downloads; synthesized drums keep everything on the device.
- **Syncing the synth's notes to the beat** — notes stay free, played by the hands.
