@AGENTS.md

# gibber-hands — guide for Claude Code

Play a Gibber synth with your hands, in the browser. Webcam → MediaPipe gesture recognition →
musical parameters → Gibber audio, with a small instrument-like UI and the generated Gibber code
shown live. Must work from a GitHub Pages link in 10 seconds, and degrade to sliders without a webcam.

## Why this project exists
Portfolio piece for creative-tooling / frontend-leaning roles. Two things matter more than feature count:
1. It feels like an instrument (low latency, no jitter, obvious feedback).
2. The build process is visible: `docs/PROCESS.md` logs what the agent proposed, what was rejected and why.

## Architecture (keep it)
```
webcam ─► src/hands/tracker.ts ─► HandPair  ─► src/mapping/handToSynth.ts ─► SynthParams ─► src/synth/engine.ts
                                     │                                                             │
                                     └─► src/ui/* (overlay, sliders fallback, layout, live code) ◄─┘
```
- `HandPair` (src/hands/types.ts), a `HandState` per side (right and left), is the only contract between vision and audio. MediaPipe types never leave `hands/`.
- `mapping/handToSynth.ts` is pure and unit-tested. Change behaviour there first, then wire.
- `synth/engine.ts` is the only file that imports Gibber.
- Reuse the author's own libraries: Resizer (panels) and drag-kit (presets). Their 2024 files are copied into the repo. Each copied file starts with a header that links its original commit and lists every fix. Change them only with minimal fixes, each added to that list. Don't rewrite them.

## Workflow (spec first)
- Behaviour is defined by the approved specs in `.ai/features/<feature>/SPEC.md`. Read the milestone's spec before changing behaviour. If code and spec disagree, update the spec first (bump its `version`), then the code.
- One feature per milestone: 1 `hand-tracking`, 2 `hand-to-sound`, 3 `instrument-ui`, 4 `launch`. `.ai/.current-feature` names the one in progress.
- Use the terms in `.ai/CONTEXT.md` (palm center, hand size, note lane, playing zone, preset, step hint) and avoid the synonyms each entry lists.
- Ideas outside the current spec go to `.ai/BACKLOG.md`, and only after Carlo says yes.
- Thresholds marked "tuned by ear" (pinch levels, hysteresis, ramp times): change the constant, its test and the spec together, and log the change in `docs/PROCESS.md`.
- After each milestone, add an entry to `docs/PROCESS.md`, written at the moment.
- Specs, docs, code and commit messages are in English.

## Conventions
- TypeScript strict, Vite, no framework. Keep files small; one concern per file. Node 24.
- No new dependency without a one-line justification in the PR/commit body.
- Every behaviour change in `mapping/` comes with a test in `test/`.
- Commit messages: conventional (`feat:`, `fix:`, `docs:`, `chore:`), imperative, one change per commit.
- Audio starts only from a user gesture (autoplay policy). Never autoplay. The camera is requested on page load.
- Mirror the camera (and the overlay) so the hand moves like in a mirror. HandState coordinates are in the space of what the player sees (0,0 = top-left of the mirrored view). Mirror in exactly one place.

## Gotchas (verified 2026-11-02)
- `@mediapipe/tasks-vision` is pinned to exactly 1.2.0. Its WebAssembly files load from a CDN URL that contains the version, which must match the installed package.
- `gibber.audio.lib` 2.1.4 bundles with Vite 8 (with direct-`eval` warnings from its own code). Its sound worklet `dist/gibberish_worklet.js` must be emitted as a separate file (import it with `?url`) and passed to `Gibber.init({ workletPath })`.
- The original Resizer `src/Resize.ts` fails this project's strict TypeScript settings in 5 places (`noUncheckedIndexedAccess`). Fix them in the copied file and list the fixes in its header.

## Milestones (do them in order, one PR each)
1. **Tracking** ([spec](.ai/features/hand-tracking/SPEC.md)) — `hands/tracker.ts` + overlay drawing + sliders fallback. Done when: the overlay shows landmarks and the gesture label at ≥25 fps on both reference laptops (Intel i5-1240P on Windows, Apple M1 Pro on macOS, current Chrome), and the slider fallback emits the same HandState shape.
2. **Sound** ([spec](.ai/features/hand-to-sound/SPEC.md)) — `synth/engine.ts` with Gibber: one instrument → filter → effect; `mapping` finalized with tests. Done when: moving the hand changes pitch/cutoff/amp with no audible zipper noise; closed fist mutes.
3. **Instrument UI** ([spec](.ai/features/instrument-ui/SPEC.md)) — Resizer panels, drag-kit presets, Start button, keyboard shortcuts, live code panel. Done when: a first-time visitor understands what to do without reading anything.
4. **Ship** ([spec](.ai/features/launch/SPEC.md)) — GitHub Pages deploy (workflow is already in `.github/workflows/deploy.yml`; enable Pages → Source: GitHub Actions), a 5-second GIF at the top of README, `docs/PROCESS.md` filled in.

## What not to do
- Don't add a build-time dependency on Python, or on native modules that compile at install time. Prebuilt binaries, as in Rolldown or Tailwind, are fine.
- Don't put the MediaPipe model file in the repo; load it from the hosted URL (or `public/` if offline support is ever needed).
- Don't optimise before milestone 2 is audible.
- Don't hide failures: if the webcam or audio can't start, say it in the UI.
- Don't add analytics, cookies or any request that sends visitor data. Video never leaves the device.
- Don't edit the original handMouse, drag-kit or Resizer repos. The README links their pre-2026 commits as hand-written lineage.

## Useful references
- MediaPipe Tasks Vision (web), GestureRecognizer: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js
- Gibber audio library: https://github.com/charlieroberts/gibber.audio.lib · playground for testing the live-code snippet: https://gibber.cc/playground/
- Author's earlier projects: https://github.com/CarloFanelli/handMouse , https://github.com/CarloFanelli/Resizer , https://github.com/CarloFanelli/drag-kit
