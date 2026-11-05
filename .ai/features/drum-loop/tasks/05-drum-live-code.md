# Task 05: drum-live-code

## Objective

While the drums sound, the live code sets the tempo and plays the same drum pattern and drum layers, and still runs unchanged at gibber.cc.

## Context

**Satisfies**: REQ-12

The live code is the project's bridge to Gibber: what plays should be what the visitor can paste. It comes once the loop and its drum patterns exist, since the snippet reflects both.

## Depends on

- Task 03

## Expected Behavior

- While the drums sound, the snippet sets Gibber's tempo to the drum pattern's and plays that pattern with the drum layers playing, then the notes as today.
- The snippet follows drum pattern and drum layers changes as they are heard.
- With the loop stopped, the snippet leaves the drums out.
- Pasted at gibber.cc with no edits, the snippet plays the same drum pattern, layers and tempo, with the notes over it; its drums are synthesized, with no sample downloads.

## Acceptance Criteria

- [ ] While the drums sound, the live code sets the drum tempo and plays the current drum pattern with its drum layers (REQ-12)
- [ ] The live code follows drum pattern and drum layers changes as they are heard (REQ-12)
- [ ] With the loop stopped, the live code has no drums (REQ-12)
- [ ] The snippet runs unchanged at gibber.cc, drums and notes together (REQ-12)

## Edge Cases

- Loop stopped → the live code leaves the drums out (REQ-12)
- Snippet copied with Hip-hop at 2 layers → pasted at gibber.cc, it plays kick and snare at 90 BPM, with the notes over it (REQ-12)

## Notes from implementation

- Spec 2.0 dropped the drum mute, and with it the snippet's muted case, which set the tempo alone. /dev, 2026-11-05.

- **Known limitation**: pasted at gibber.cc, one drum can start a few milliseconds after the others. Gibber starts each drum's sequence when its line reaches the audio thread, and has no stock call to start several together. The snippet builds every drum before starting any; on the app's own Gibber 2.1.4, in a busy headless browser, that kept all drums within 4 samples of each other in 5 runs of 6, and in the sixth the snare and hi-hats came 9 ms after the kick. /dev, 2026-11-05.
- **Known limitation**: the paste at gibber.cc itself is still a manual check, as for the voices. The drum code was run on the app's own Gibber 2.1.4, where every pattern at the layers tried played the app's steps and loudness at the right tempo; that build lacks gibber.cc's editor, which gives arrays the `addPattern` method Gibber's sequences call, so the check stood it in with an empty one. /dev, 2026-11-05.
