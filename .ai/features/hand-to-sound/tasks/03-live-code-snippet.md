# Task 03: live-code-snippet

## Objective

Next to the video, the live code panel shows a Gibber snippet for the current sound, note, brightness and volume. Pasted unchanged into the gibber.cc playground, it plays the same thing.

## Context

**Satisfies**: REQ-15, REQ-16

The snippet makes the instrument's state readable as code, which is the point of building on Gibber. It needs the note and the brightness from task 02 to describe the whole sound. The panel is read-only, and its final look arrives in milestone 3.

## Depends on

- Task 02

## Expected Behavior

- The live code panel shows a Gibber snippet that recreates the current sound: the synth, the filter and the reverb, with the current note, brightness and volume.
- The panel updates at most 10 times per second and always ends on the latest state.
- The snippet is shown and updating before "Start audio" is clicked, and with the slider fallback too.
- Pasted unchanged into the gibber.cc playground, the snippet plays the same sound at the same note, brightness and volume.
- When the volume is zero, the snippet still plays (silence), and a comment line says how to raise the volume.
- The app never contacts gibber.cc; the snippet is plain text.

## Acceptance Criteria

- [ ] The panel shows a Gibber snippet for the current sound, note, brightness and volume (REQ-15)
- [ ] The panel updates at most 10 times per second and shows the latest state within 100 ms (REQ-15)
- [ ] The snippet is shown and updating before "Start audio" is clicked (REQ-15)
- [ ] Pasted unchanged into gibber.cc, the snippet plays the same sound at the same note, brightness and volume (REQ-16)
- [ ] A snippet copied while silent plays silence and carries a comment on how to raise the volume (REQ-16)

## Edge Cases

- Hand moves before "Start audio" → the snippet still updates (REQ-1, REQ-15)
- Snippet before "Start audio" → shown and updating (REQ-15)
- Hand moving fast → the panel updates at most 10 times per second and shows the latest state within 100 ms (REQ-15)
- Snippet copied while silent → plays silence; a comment line in the snippet says how to raise the volume (REQ-16)
- Snippet uses functions missing from the playground's Gibber → must not happen; review pastes the snippet into gibber.cc to check (REQ-16)
- Network → N/A: the app never contacts gibber.cc; the snippet is plain text (REQ-16)

## Notes from implementation

- **Impacts Task 03**: from task 01, the sound is a sawtooth into Gibberish's ladder filter (model 1, Q 0.5), then Freeverb (wet1 0.3, wet2 0, dry 0.7), then an output gain of 1.4 × the volume. The reverb is linear, so a steady snippet can put that gain on the synth instead.
- **Impacts Task 03**: from task 02, the mapping now takes its previous result, which the note lane's hysteresis needs, and `src/main.ts` keeps that result in `sound`. Build the snippet from that same value instead of calling the mapping a second time. The result also carries the played note lane (`lane`, null without a hand), and the mapping exports each lane's note name (`NOTE_LANES`), if the snippet names the note. The voice now glides pitch (40 ms, only while sound plays) and cutoff (15 ms). A steady snippet doesn't need either glide.
- **Known limitation**: the snippet was checked against the Gibber 2.1.4 bundle installed here, not against gibber.cc itself. In headless Chromium, three snippets copied from the panel played the same level within 0.03 dB and the same timbre within 0.2 dB per harmonic as the app. The states were the darkest, a middle and the brightest brightness, at a quarter and at full volume. The silent snippet plays silence, and its hint brings back full volume. The playground may run a newer Gibber, and the snippet relies on its `Gibberish` global, which Gibber 2.1.4 exports. Pasting a loud and a silent snippet into gibber.cc is a manual check. /dev, 2026-11-03.
