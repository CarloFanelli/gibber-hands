# Task 02: note-lanes-and-brightness

## Objective

Moving the palm center left and right plays the 8 notes of A minor pentatonic, one per note lane, and palm height sets the brightness. The overlay draws the note lanes and highlights the one being played.

## Context

**Satisfies**: REQ-4, REQ-5, REQ-6, REQ-7, REQ-8, REQ-9, REQ-17

Task 01 made the sound and its volume. This task makes the position of the palm center musical, across the playing zone. The hysteresis keeps a resting hand on one note, and the slides keep note changes smooth. With the slider fallback, the horizontal slider plays the same note lanes. Its note name stands in for the lanes on the overlay, which the sliders replace.

## Depends on

- Task 01

## Expected Behavior

- The central 80% of the view's width holds 8 equal note lanes. A palm center beyond either side plays the nearest outer lane.
- From left to right the lanes play A3, C4, D4, E4, G4, A4, C5, D5, in equal temperament with A4 at 440 Hz.
- The note changes only after the palm center passes a lane border by more than 20% of a lane's width.
- When the note changes while sound is playing, the pitch slides to the new note in 40 ms without restarting the sound.
- The overlay draws the 8 note lanes with their note names and highlights the lane being played.
- Palm height sets the filter cutoff exponentially across the central 80% of the view height: 200 Hz at its bottom, 6.4 kHz at its top. Cutoff changes ramp over 15 ms.
- Sweeping the palm across the full height in 0.5 s produces no audible click or zipper noise, checked by ear and on a spectrogram of a recording.
- With the slider fallback, the horizontal slider plays the same note lanes and shows the current note name.

## Acceptance Criteria

- [ ] The playing zone holds 8 equal note lanes; a palm center beyond either side plays the outer lane (REQ-4)
- [ ] The note lanes play A3, C4, D4, E4, G4, A4, C5, D5 from left to right, A4 = 440 Hz (REQ-5)
- [ ] The note changes only past a border by more than 20% of a lane; a ±1% wobble keeps it (REQ-6)
- [ ] A note change while sound plays slides in 40 ms without restarting the sound (REQ-7)
- [ ] The overlay draws the 8 note lanes with note names and highlights the one being played (REQ-8)
- [ ] Palm height sets the cutoff exponentially from 200 Hz at the playing zone's bottom to 6.4 kHz at its top (REQ-9)
- [ ] With the sliders, the horizontal slider shows the current note name and its ends play lanes 1 and 8 (REQ-17)

## Edge Cases

- Palm left of the central zone → lane 1 (A3) (REQ-4)
- Palm exactly on a lane border when sound starts → the lane to the right of the border (REQ-4)
- Hand lost, then found again → previous lane forgotten; the lane under the palm is used, no hysteresis (REQ-4, REQ-6)
- Outer lanes → lane 1 = A3 (220 Hz), lane 8 = D5 (587.33 Hz) (REQ-5)
- Tuning → equal temperament, A4 = 440 Hz (REQ-5)
- Palm wobbling ±1% of view width around a border → note doesn't change (REQ-6)
- Palm crosses two lanes in one frame → goes straight to the new lane, no notes in between (REQ-6)
- Note changes while silent (fingers apart) → pitch jumps at once; the next squeeze starts on the new note (REQ-7)
- Several note changes within 40 ms → the slide heads to the latest note (REQ-7)
- Hand moves before "Start audio" → no sound; the lanes are still drawn and highlighted (REQ-1, REQ-8)
- Slider fallback active → no lanes; the horizontal slider shows the current note name (REQ-8, REQ-17)
- No hand in view → lanes drawn, none highlighted (REQ-8)
- Camera panel narrower than 320 px → lanes drawn without note names (REQ-8)
- Palm above the central zone → 6.4 kHz (REQ-9)
- Palm below the central zone → 200 Hz (REQ-9)
- Hand lost → cutoff stays where it was while the sound fades (REQ-9, REQ-13)
- Lowest note with the darkest cutoff → still clearly audible: A3 (220 Hz) sits just above the 200 Hz cutoff and is only a few dB quieter (REQ-14 · from code)
- Highest cutoff with resonance at full volume → peak stays at or below −3 dBFS, no self-oscillation (REQ-14)
- Horizontal slider at 0 or 1 → lane 1 or lane 8 (REQ-17, REQ-4)

## Notes from implementation

- **Impacts Task 02**: from task 01, the volume is a Web Audio gain after the reverb, not a slide in Gibber's worklet. The voice in the worklet has no slides yet: pitch and cutoff are plain inputs, so the 40 ms pitch slide and the 15 ms cutoff ramp still go into its graph (`voiceGraph` in `src/synth/engine.ts`). Its source runs inside the worklet, so it can't use outside constants. Its cutoff input is a fraction of the Nyquist frequency. Measured with the task 01 voice, A3 with the cutoff at 200 Hz is about 4 dB quieter in RMS than with it at 1131 Hz.
- **Known limitation**: the highlight of the played note lane was not seen on screen. The headless browser's fake camera shows no hand, so the screen check covered only the lanes with no hand: drawn with their note names and none highlighted, and without names in a 300 px panel. The highlighted lane is the mapping's lane, which the unit tests cover. Check it with a real hand. The slide, the jump while silent, the hysteresis readout and the cutoff sweeps were measured with the sliders. A 0.5 s sweep in 30 and in 15 steps (slider and camera rate) shows no click on the spectrogram, while a control with instant cutoff steps shows one at every step. Judging by ear is a manual check. /dev, 2026-11-03.
