# Task 02: six-presets

## Objective

The instrument panel lists six presets. Clicking one switches to its sound, scale and effect with a short crossfade; the note lane labels and the slider's note name follow, and the choice is remembered.

## Context

**Satisfies**: REQ-5, REQ-6, REQ-7, REQ-8, REQ-9, REQ-10

Milestone 2 built one sound, which becomes preset 1, Saw Lead. Every preset is a sustained sound, so the squeeze, fist, lost-hand, slide and brightness rules of hand-to-sound apply to each one unchanged. Timbre, delay time and resonance are tuned by ear; the spec table fixes scales, notes, effect types and mixes. Dragging arrives in task 03, keys in task 05.

## Depends on

- Task 01

## Expected Behavior

- The instrument panel lists six presets, each showing its number key, name, character and scale name. The selected preset is marked.
- Clicking or tapping a preset selects it.
- Each preset plays its own scale across the 8 note lanes, with its own sound character, effect and effect mix, as in the spec table: Saw Lead, Warm Pad, Organ, Deep Bass, Brass, Blues Reed.
- Switching preset crossfades the old and new sounds within 60 ms and keeps the note lane being played.
- The note lane labels on the overlay and the note name beside the horizontal slider show the current preset's notes.
- The last selected preset is restored on the next visit; a first visit starts on Saw Lead.
- Every preset peaks at or below −3 dBFS at full volume, and the presets' average loudness is within 3 dB of each other.

## Acceptance Criteria

- [ ] Six presets are listed with number key, name, character and scale name; a click selects one (REQ-5, REQ-6)
- [ ] Each preset plays its table scale, sound character, effect and effect mix (REQ-8)
- [ ] Switching crossfades within 60 ms and keeps the note lane being played (REQ-7)
- [ ] The overlay's lane labels and the slider's note name show the current preset's notes (REQ-10)
- [ ] The last preset returns on the next visit; a first visit starts on Saw Lead (REQ-9)
- [ ] Every preset peaks at or below −3 dBFS, with average loudness within 3 dB of each other (REQ-8)

## Edge Cases

- Instrument panel at its 160 px minimum → names wrap; character labels hidden (REQ-5)
- N/A — empty: the preset list is built into the page and never empty (REQ-5)
- Preset picked before audio starts → selected silently, used when audio starts (REQ-6)
- Switching while silent → instant, no crossfade needed (REQ-7)
- Keys 1, 2, 3 pressed within 60 ms → ends on preset 3; never two sounds at once (REQ-7)
- Switching while a fist mutes → stays silent (REQ-7)
- Any preset at full volume with the brightest cutoff → peak at or below −3 dBFS (REQ-8)
- Two presets compared → average loudness within 3 dB (REQ-8)
- N/A — network: presets are built into the page (REQ-8)
- Saved preset no longer exists (renamed in an update) → Saw Lead (REQ-9)
- Browser storage blocked → Saw Lead every visit (REQ-9)
- Preset switched while a note plays → labels update at once; the same lane plays the new preset's note (REQ-10)
- Slider fallback active → the note name beside the horizontal slider uses the current preset's notes (REQ-10)
- Snippet for any preset → shows that preset's sound; pasted into gibber.cc, it plays the same note, brightness and volume (REQ-8 · from code)
