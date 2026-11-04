---
feature: two-hand-play
version: 1.0
status: approved
base: 552abfe58e22dffc0022d42a48be36e324c09ead
completed: false
---

# Two-hand play

## Overview

Two-hand play lets the player use both hands. The right hand, the **lead hand**, always plays notes as today. The left hand, the **second hand**, plays notes too, so two notes can sound at once; the Victory sign switches it to **shape mode**. In shape mode, holding its squeeze lifts every note an octave, for fast jumps, and its height sets the reverb or echo amount. A swap control serves left-handed players, the camera view and live code show what each hand does, and one more step hint teaches the switch. A single hand still plays exactly as before.

## Project Context

- Replaces the hand-tracking rule that follows one hand and ignores the other, and the hand-to-sound limit of one sound at a time.
- Pinch to play, note lanes, brightness, the fist and lost-hand rules apply unchanged to each playing hand.
- The camera view is mirrored: the player's right hand appears on the right of the view.
- The six presets, the crossfade, step hints and the slider fallback from instrument-ui stay; this feature adds to them.
- The hand model already reports whether each hand is left or right, and recognises the Victory sign.
- The live-code snippet must keep running unchanged at gibber.cc.
- No new runtime dependency.
- Comes before the launch milestone, which is paused.

## Functional Requirements

### Hands

- REQ-1: Up to two hands are tracked at once; a third hand in view is ignored.
- REQ-2: The player's right hand is the lead hand and the left hand is the second hand.
- REQ-3: A control in the instrument panel swaps the two roles for left-handed players, and the choice is remembered between visits.
- REQ-4: A single hand in view plays notes as in the hand-to-sound spec, unless it is the second hand in shape mode.

### Playing with two hands

- REQ-5: The lead hand always plays notes; the second hand plays notes too until it is switched to shape mode.
- REQ-6: Each playing hand plays its own note with the existing rules: note lane, brightness from height, volume from squeeze, silence from a closed fist.
- REQ-7: Both hands play the current preset's 8 note lanes in the same octave, so two hands can sound two notes at once.

### Switching

- REQ-8: Showing the Victory sign with the second hand switches it between playing notes and shape mode, once per sign.
- REQ-9: The second hand starts every visit playing notes; its mode then lasts until the next Victory sign, even out of view.

### Shape mode

- REQ-10: In shape mode, holding the second hand's squeeze closed raises every note one octave at once; opening it brings them back at once.
- REQ-11: While the octave is raised, brightness doubles with it, so upper notes sound as bright as the same lane below.
- REQ-12: In shape mode, the second hand's height sets the reverb or echo amount, rising from none at the bottom of the playing zone.
- REQ-13: Middle height gives the preset's own effect amount, and the top gives double that, at most 80%.
- REQ-14: Without a second hand in shape mode, notes play in the normal octave with the preset's own effect amount.

### Feedback

- REQ-15: The camera view labels the second hand's mode; while shaping it shows "Octave up" when squeezed and the effect amount in percent.
- REQ-16: Each playing hand's note lane is lit, and the lane labels name the notes in the octave being played.
- REQ-17: The live code shows every sounding note with the current octave and effect amount, and still runs unchanged at gibber.cc.

### Guidance

- REQ-18: After the first sound has lasted a second, one more step hint shows a Victory-sign icon and "Left hand: shape sound".
- REQ-19: That step hint goes once the second hand first switches to shape mode, and never returns in that browser.
- REQ-20: The help sheet describes both hands' roles, the Victory switch, and shape mode's squeeze and height.

### Without a camera

- REQ-21: Without a camera, the sliders add an "Octave up" switch and an effect slider that act like a second hand in shape mode.

## Data & Dependencies

### Information the feature must retain

- Lead-hand choice — right by default; set by the swap control, kept until the visitor clears site data.
- Second hand's mode — per visit only; starts as playing notes.
- Second-hand hint done — set the first time the second hand switches to shape mode; never unset.

### External capabilities relied on

- Hand tracking that reports up to two hands, whether each is left or right, and its gesture — the hand model already used.
- Browser local storage — to remember the above. If it's unavailable, everything works and nothing is remembered.

## Non-Functional Requirements

- **Performance** — With two hands moving and audio on, tracking runs at ≥ 25 fps on both reference laptops (i5-1240P Windows, M1 Pro macOS, current Chrome).
- **Performance** — An octave jump sounds on the first tracked frame where the squeeze crosses its level, with no added smoothing.
- **Validation** — One hand alone sounds within 1 dB of today's level; two hands at full squeeze, brightest and octave raised peak at or below −3 dBFS on every preset.
- **Validation** — Octave jumps and effect-amount changes make no click or zipper noise.
- **Validation** — With a real hand, at least 19 of 20 Victory signs by the second hand switch its mode, and no other gesture switches it in 2 minutes of playing.
- **Security** — No new network requests; video still never leaves the device.

## Edge Cases & Error Handling

| Edge Case | Expected Behavior | Relates to |
|-----------|-------------------|------------|
| A third hand in view (e.g. a second person) | Ignored until one of the two tracked hands leaves | REQ-1 |
| Two hands both read as right (two people, or a misreading) | The one further right in the camera view counts as the right hand | REQ-1, REQ-2 |
| N/A — network: tracking runs on the device; the hand model loads as in the hand-tracking spec | — | REQ-1 |
| Hands cross | Each keeps its role while both stay tracked | REQ-2 |
| A hand's left/right reading flickers | A tracked hand keeps the role it had when it appeared until it leaves the view | REQ-2 |
| No hand in view | Silence, normal octave, the preset's own effect amount, as today | REQ-2, REQ-14 |
| Roles swapped while playing | The second hand goes back to playing notes; sounding notes continue | REQ-3, REQ-9 |
| Browser storage blocked, or the saved choice unreadable | The right hand leads every visit, no error | REQ-3 |
| Only the second hand in view, in shape mode | No sound; the octave and the effect amount still follow it | REQ-4 |
| A lone left hand is playing when the right hand appears | The left keeps playing its note; both hands now play | REQ-4, REQ-5 |
| The lead hand shows the Victory sign | Nothing switches; its note is silent while its fingers are apart, as today | REQ-5 |
| Victory sign with both hands at once | Only the second hand switches | REQ-5, REQ-8 |
| One hand makes a fist while the other squeezes | Only the fist hand's note goes silent | REQ-6 |
| One hand leaves the view | Only its note fades, over 100 ms as today | REQ-6 |
| Tab hidden | Both hands count as gone; both notes fade | REQ-6 |
| Both hands in the same lane | Both play the same note; the peak limit still holds | REQ-7 |
| Preset switched while two hands play | Both notes crossfade within 60 ms, each keeping its lane | REQ-7 |
| Victory sign held | One switch; switching again needs the sign dropped and shown again | REQ-8 |
| Victory sign seen for less than the gesture label's confirmation time | No switch | REQ-8 |
| Switch to shape mode while the second hand's note sounds | Its note fades within 100 ms, as for a lost hand | REQ-8 |
| Switch back to playing while the octave is raised | The octave returns to normal at once; the effect glides back to the preset's amount | REQ-8, REQ-14 |
| The second hand leaves in shape mode and returns | Still in shape mode | REQ-9 |
| Page reloaded | The second hand plays notes again | REQ-9 |
| Squeeze hovering near the octave level | The octave goes up at the full-volume squeeze level and back only once the squeeze opens clearly past it (tuned by ear): no flicker | REQ-10 |
| Closed fist with the shaping hand | Not a squeeze: the octave stays normal | REQ-10 |
| Octave raised while no hand plays | Nothing sounds; the next note starts in the upper octave | REQ-10 |
| Octave jump and lane change at the same moment | Both land at once; an octave never slides | REQ-10 |
| Octave raised on the highest note (Warm Pad, E5 to E6) | Plays; the peak limit holds | REQ-10, REQ-11 |
| Darkest brightness, octave raised | The upper note is within 3 dB of the same lane in the normal octave | REQ-11 |
| Brightest, octave raised | Brightness reaches 12,800 Hz; the peak limit holds | REQ-11 |
| Shaping hand above or below the playing zone | The amount stays at the top or bottom value | REQ-12 |
| Effect amount changes | It glides, no zipper noise | REQ-12 |
| Warm Pad (60%) at the top | 80%, not 120% | REQ-13 |
| Preset switched while shaping | The same height gives the new preset's scaled amount | REQ-13 |
| Shaping hand leaves while the octave is raised | Notes drop to the normal octave at once; the effect glides back to the preset's amount | REQ-14 |
| Camera panel narrower than 320 px | Labels shrink to icon and number (✌, ↑, 45%) | REQ-15 |
| No second hand in view | No second-hand labels | REQ-15 |
| Two hands in different lanes | Both lanes lit | REQ-16 |
| Octave raised | Lane labels show the upper notes at once (Saw Lead: A4 … D6) | REQ-16 |
| Two notes sounding | The snippet holds both voices; one note gives today's single voice | REQ-17 |
| Snippet copied with the octave raised and the effect at 45% | Pasted at gibber.cc, it plays the same notes and amount | REQ-17 |
| No note sounding | The snippet is as today: silent, with the line that makes it sound | REQ-17 |
| Roles swapped | The hint reads "Right hand: shape sound" | REQ-18 |
| No camera (sliders) | The second-hand hint never shows | REQ-18 |
| Hint ignored | It hides after 10 s and returns on the next visit, until the second hand first switches | REQ-19 |
| Browser storage blocked | The hint returns every visit until the second hand switches in that visit | REQ-19 |
| Roles swapped | The help sheet names the left hand as the lead hand | REQ-20 |
| N/A — empty and concurrent: the help sheet is fixed text | — | REQ-20 |
| "Octave up" switch on, pinch slider at full | Plays the upper octave | REQ-21 |
| Effect slider untouched | It sits at the middle: the preset's own amount | REQ-21 |
| Keyboard only | The switch and the slider are reachable with Tab, with focus outlines | REQ-21 |

## Out of Scope

- **Freezing a note** — stays in the backlog; the octave squeeze covers fast jumps.
- **Octave down** — not requested; the upper octave covers the stated need.
- **A different preset per hand** — both hands share one sound, so the engine and the snippet stay one preset at a time.
- **More than two hands, or two players** — one player at a time.
- **The Victory switch on the lead hand** — only the second hand switches, so something always plays.
- **Remembering the second hand's mode between visits** — a new visit always starts with both hands playing, as a newcomer expects.
- **A second playing voice on the sliders** — they stand in for one hand; the octave switch and effect slider cover shape mode.
- **Drums and rhythm** — the next feature, with its own interview.
