# How this was built

gibber-hands is built with Claude Code. This file is the log: what I asked, what the agent proposed, what I accepted, what I rejected and why. Entries are short and written at the moment, not reconstructed later.

## The workflow

Every milestone goes through the same five steps. Each step leaves a file in the repo, so the process can be checked rather than taken on trust.

1. **Brief.** [`CLAUDE.md`](../CLAUDE.md) holds the architecture, conventions, milestones and what not to do. I wrote it with Claude, together with the starting skeleton (file stubs, a first test, the deploy workflow). Claude Code reads it at the start of every session.
2. **Requirements interview.** Claude acts as product owner. It reads the code first, then asks one question at a time, each with a recommended answer and the reason for it. The result is `.ai/features/<feature>/SPEC.md`, which contains:
   - numbered requirements, each a pass/fail check (`REQ-N`);
   - an edge-case table that checks each requirement against at least two of: limits, empty input, concurrency, permissions, network failure, data integrity;
   - out-of-scope items with a rationale.

   Nothing is saved until I approve the draft. Follow-up ideas go to `.ai/BACKLOG.md` only if I say yes. Terms that needed clarifying go to the glossary, `.ai/CONTEXT.md`.
3. **Task breakdown.** The approved spec becomes ordered task files (`tasks/NN-<name>.md`), each tied to the requirements it satisfies, plus `progress.txt`. A technical pass then writes `ARCHITECTURE.md`: how each task fits the code, with an impact analysis for the risky ones. I approve the task list, then the technical pass.
4. **Implementation.** One task at a time. Claude shows the diff and waits for my approval, and each approved task is one commit.
5. **Review.** Claude checks the diff against the spec and writes severity-tagged findings to `REVIEW.md`. Fixes go back through step 4.

What stays mine: every product decision (the agent recommends, I choose), every approval gate, and whatever goes public.

## Log

### 2026-11-02 — Setup and specs

- **Asked:** create a GitHub repo named after the folder.
  - The agent's first attempt to create it as *public* was blocked by Claude Code's safety check, because I hadn't said public or private. It asked me, and I chose public, since GitHub Pages on a free plan needs it.
- **Asked:** analyse the skeleton, remove what shouldn't be there, fix what's needed, and write the specs.
- **Accepted** (verified afterwards: typecheck, 3 tests and the build pass):
  - Removed 19 `:Zone.Identifier` files. They are Windows metadata from downloading the skeleton zip, and they stay ignored through `.gitignore`.
  - Upgraded TypeScript 5.6 → 7.0.2, Vite 5 → 8.3.5 and Vitest 2 → 5.1.0. The skeleton targeted versions two or three majors behind.
  - Pinned `@mediapipe/tasks-vision` to exactly 1.2.0, because its WebAssembly files load from a CDN URL that contains the version and must match the JS. Pinned `gibber.audio.lib` to exactly 2.1.4.
  - Added `package-lock.json`. Without it, the `npm ci` step in the deploy workflow fails.
  - Deploy workflow: Node 20 → 24 (Node 20 reached end of life on 2026-04-30), and the GitHub Actions moved to their current major versions.
- **Found in the skeleton,** to be fixed through the specs rather than patched now:
  - the webcam is requested on page load;
  - a failed webcam falls back to sliders with only a console message;
  - the Start button is not wired;
  - the tracker notes omit loading MediaPipe's WebAssembly files;
  - CSS mirrors the overlay and the notes also mirror the coordinates, which would mirror the drawing twice;
  - "open palm = hold" would freeze the note whenever the hand relaxes;
  - note boundaries have no hysteresis, so the note flickers between two neighbours;
  - pinch thresholds don't account for distance from the camera;
  - gibber.audio.lib has had no release since September 2022, and its build tooling brings 23 npm audit warnings (none of that code reaches the browser bundle);
  - Resizer and drag-kit are not npm packages, and both are mouse-only.
- **Proposed by the agent, decided otherwise by me:**
  - Specs in Italian (the agent defaults to the language I write in). I chose English.
  - The creative front-end notes as a separate doc. I chose a README section.
  - A full spec for milestone 1 only, with the others queued. I chose all four specs now.
  - A one-line mention of planeProjects (my offline plan for these experiments). I left it out.
- **Lineage:** the README credits handMouse, drag-kit and Resizer, which I wrote by hand before using AI assistants, with links to their pre-2026 commits.

### 2026-11-02 — The four specs

All four were written in one session, through one interview per milestone.

- **Checked by the agent before asking:**
  - First visit downloads about 12 MB: the 8.4 MB hand model, 3.2 MB of compressed MediaPipe WebAssembly, and under 1 MB of app code.
  - gibber.audio.lib builds with Vite 8, but its sound worklet has to be served as a separate file.
  - The gibber.cc playground is online.
  - My 2024 Resizer fails this project's strict TypeScript check in 5 lines, and both libraries are mouse-only.
- **[Hand tracking](../.ai/features/hand-tracking/SPEC.md)** (17 requirements):
  - Proposed: one Start button that asks for the camera and starts audio. I chose to ask for the camera on page load.
  - Proposed and accepted: the palm center (not the index fingertip) moves the note, so pinching doesn't shift it.
  - Proposed: this Windows laptop as the 25 fps reference. I chose both my laptops, with the Windows one (i5-1240P) as the floor, since it's the weaker machine.
- **[Hand to sound](../.ai/features/hand-to-sound/SPEC.md)** (17 requirements). All recommendations accepted:
  - "squeeze to play": fingers touching is full volume, apart is silent;
  - no hold gesture;
  - 40 ms slides between notes;
  - effect amount fixed per sound;
  - A minor pentatonic over 8 note lanes in the central 80% of the view;
  - a live-code snippet that must run unchanged at gibber.cc.
- **[Instrument UI](../.ai/features/instrument-ui/SPEC.md)** (20 requirements):
  - Accepted: Resizer and drag-kit copied in with minimal, listed fixes, leaving the originals untouched; step hints over the video for first-time visitors.
  - Proposed: four pentatonic presets. I chose six presets with varied scales.
  - The agent then flagged that plucked or bell sounds would break the slide rule from the sound spec. We kept sustained sounds only.
- **[Launch](../.ai/features/launch/SPEC.md)** (11 requirements):
  - Proposed: a video with sound under the GIF. I kept the GIF only, as planned.
  - Accepted: a link preview image and no analytics.
- **Backlog:** five follow-ups saved in [`.ai/BACKLOG.md`](../.ai/BACKLOG.md):
  - two-hand play;
  - a hold gesture;
  - hand-controlled effect;
  - editable live code;
  - picking presets with the hand.

### M1 — Tracking (2026-11-02)

- **Plan:** the agent split the [spec](../.ai/features/hand-tracking/SPEC.md) into five tasks: camera view, hand model loading, tracked-hand overlay, pinch and gestures, slider fallback. I approved the tasks and the technical plan without changes.
- **Gaps the technical plan found in the spec.** I took the recommended answer both times:
  - Switching to another tab stops the video frames. The hand now counts as gone at once, so in milestone 2 a held note can't keep sounding in a background tab.
  - If the camera stops mid-session (unplugged, or taken by another app), the sliders appear, as they do when the camera fails on page load.
- **Proposed and accepted:** a One Euro filter for the palm center instead of the skeleton's moving average. An average steady enough for the 0.3% target lags two frames or more. On synthetic noise the filter halves still-hand jitter (standard deviation 0.0047 → 0.0022) and lags half a frame or less.
- **Implementation in autopilot.** The agent ran its own checks and committed each task without waiting for my approval. I reviewed the milestone as a whole at the end.
- **How it was checked:**
  - Unit tests cover every piece that needs no browser: camera errors, model failures, palm center, pinch, presence, smoothing, gesture debounce, sliders and startup. There are 71 in all.
  - In the browser, the agent drove headless Chromium with a fake camera that showed MediaPipe's own sample hand photos to the real model.
  - It tried every failure: camera blocked and then allowed, each model file blocked, a corrupt model, offline, a tab switch, camera loss, and phone width.
  - The model recognised thumb up (69%), pointing up (85%), closed fist (92%) and victory (77–80%).
- **Found while building:**
  - The browser test caught a bug the unit tests missed. The code reset the gesture on every new hand, not only when the hand was gone as the plan said. Below about 7 fps every frame counts as a new hand, so no gesture was ever confirmed.
  - At phone width, Try again was 35 px tall (now 44), and the "Video stays on your device" line covered the gesture menu.
  - This environment emulates graphics in software. MediaPipe took about 450 ms per frame on that path against 50 ms on the processor, so tracking ran at 2–3 fps. The 25 fps target has to be measured by hand.
  - On a half-size photo the middle pinch moved 20%, more than the 15% allowed between 40 and 80 cm. The formula doesn't depend on hand size, so this is landmark noise on a small hand. It needs a check with a real hand.
  - A stall in MediaPipe's runtime files can't be detected, because its loader reports no progress. A failed download is still reported, with the file name.
- **Backlog:** I approved two follow-ups:
  - run tracking on the processor when graphics are emulated in software;
  - steady the middle pinch if the real-hand check fails.
- **Review:**
  - Three reviewer agents each read a different part of the code. The main agent checked every claim against the code before writing it down.
  - It kept five findings. The one that mattered: the logic choosing between camera and sliders had no test. The other four were minor.
  - It rejected two claims. One called a version constant unused, but a test imports it. The other wanted the gesture reset after a gap in frames, which would break gestures again below 7 fps.
  - All five were fixed in one commit, and a second review approved it.
- **Decided by me:** `main` stays the main branch, with one branch and one pull request per milestone. I considered a `dev` branch and dropped it, because the deploy workflow and the launch spec already build on `main`.
- **Still to check before merging:** 25 fps on both laptops, and the middle pinch at 80 cm with a real hand.

### M2 — Sound (2026-11-03)

- **Plan:** the agent split the [spec](../.ai/features/hand-to-sound/SPEC.md) into three tasks: squeeze to play (start, stop and volume), note lanes and brightness, and the live-code snippet. I approved the tasks and the technical plan, with two answers to questions it raised:
  - The darkest brightness stays at 200 Hz. The spec gave the wrong reason for it ("the cutoff stays above the note"), since the lowest note, A3, is 220 Hz. The note is still clearly audible, about 4 dB quieter, and the task now says so.
  - The placeholder preset buttons are gone until milestone 3, so the instrument panel shows only Start audio.
- **The technical plan read Gibber's source before any code was written** and found four traps in version 2.1.4:
  - The package's main file has no start function, but the prebuilt bundle has one. The setup check had only built Gibber, never run it.
  - Gibber builds its audio on the next click or key press after starting, so it misses the click that started it. The engine now sends that event itself.
  - A sound worklet that fails to load hangs the start forever. The engine now downloads it first, with a timeout.
  - Every setting change is an instant jump, which clicks. The voice is a custom instrument whose pitch and brightness glide sample by sample.
- **Implementation in autopilot.** I stopped it after task 1, then let it finish tasks 2 and 3.
- **Changed from the plan by the agent,** recorded in the task notes:
  - The volume is a browser audio gain placed after the reverb, not a glide inside Gibber. Silence then cuts the reverb tail too.
  - The snippet doesn't use Gibber's stock Synth, which the plan suggested. Its envelope also scales the volume and the brightness, and at full sustain it plays silence. The snippet rebuilds the engine's chain instead: a sawtooth, the ladder filter, then the reverb.
- **Found while building:**
  - About one start in three was silent. Gibber's worklet could render once before it knew its output, and then stopped for good while still answering messages. The fix: a silent placeholder, sent the moment the worklet exists. After it, 12 of 12 starts in development and 5 of 5 in the production build played.
  - Gibber's start hangs unless the library is also on `window`, because its music theory module looks for it there.
  - Starting the audio adds about 460 MB to the tab, because Gibber reserves a fixed 20-minute sound buffer.
  - The first test recorder dropped audio buffers, and the gaps sounded like clicks. The agent switched to recording inside an audio worklet.
  - The agent's click measure couldn't detect zipper noise on the brightness, but spectrograms could. Instant steps leave one stripe each, and the 15 ms ramp leaves none.
- **How it was checked:**
  - 109 unit tests in all. They cover the volume curve, the fist, the lost hand, note lanes and their hysteresis, the brightness curve, states from the sliders, ramp times, engine failure reasons, the snippet and the throttle on the code panel.
  - The agent drove headless Chromium through the sliders and checked:
    - starting by mouse, keyboard and touch, and double clicks;
    - the volume curve, the fist and Stop fades, and resume;
    - the peak level: about −6 dBFS, against a −3 dBFS limit;
    - a blocked or slow worklet download, and a browser without audio worklets;
    - note glides, jumps while silent, and brightness sweeps.
  - A snippet copied from the panel and run in a local copy of Gibber 2.1.4 matched the app's level within 0.03 dB.
- **Review:**
  - The first review found two minor issues. The code panel stayed blank until the camera and the hand model were ready, and no test locked the two tuned glide times. Both were fixed in one commit, and a re-check approved it.
  - A second full review found nothing. It also compared the Gibber that the gibber.cc playground runs with 2.1.4. Everything the snippet uses behaves the same. The two differences, a reverb wrapper and a cap on resonance at 1, don't affect it.
- **Backlog:** I approved one follow-up: cut the 460 MB that Gibber adds, which means patching its bundle.
- **Still to check before merging:**
  - listening for clicks;
  - the lane highlight with a real hand;
  - pasting a loud and a silent snippet into gibber.cc;
  - 25 fps with audio on, on both laptops;
  - Edge, Firefox and Safari.

### M3 — Instrument UI (2026-11-03)

- **Plan:** the agent split the [spec](../.ai/features/instrument-ui/SPEC.md) into six tasks: resizable panels, six presets, dragging a preset onto "Now playing", first-visit guidance, keyboard and help, and the code panel tools. I approved the tasks and the technical plan. The plan raised four gaps, and I took the recommended answer each time:
  - Every preset uses only stock Gibber pieces (one oscillator, the ladder filter, a reverb or a delay), so the live-code snippet still runs at gibber.cc for all six.
  - While a step hint says "Allow the camera" or "Raise your hand", the camera view's own message saying the same thing is hidden.
  - Opening gibber.cc with the camera on hides this tab, so the hand counts as gone and the sound fades. Audio stays on and plays again on return.
  - The bars between panels stay mouse-only. I changed this later (see below).
- **The technical plan read the code first** and found five traps:
  - The panels' CSS ignored the widths Resizer sets.
  - Hiding the code panel made Resizer rescale the saved sizes by position. Camera and instrument would have got 67.5% and 37.5% of the row, 105% in all.
  - Gibber reads a Delay's time in measures at 140 BPM, so the engine converts it the same way, or the snippet's echo would not match the app's.
  - drag-kit fires a click on the card when a drag ends, which would pick the card even when it was dropped elsewhere.
  - The code panel is rewritten up to 10 times a second, so a selection made to copy the code by hand would vanish while the hand moves. The panel now holds still while a selection touches it.
- **Implementation in autopilot,** in two runs: tasks 1 to 5, then task 6. Every task passed the tests, the type check and the build before its commit.
- **Decided by me during the work:** in task 5, the agent pointed out that the keyboard requirement covers every control, including the bars between panels. I reversed my planning answer and chose arrow keys. The copied Resizer got it as a ninth listed fix.
- **Found while building:**
  - Switching back to a resting preset replayed its old note from its reverb. In Warm Pad it was only 4.6 dB under the new note. Each resting preset now also closes its way into its effect, and what is left is 28 to 39 dB under the new note.
  - Three drag-kit traps:
    - In a grid, a dragged card jumped to the list's corner, so the cards sit in plain block flow.
    - drag-kit's faded copy of the card painted on top of it, so a plain click on a card did nothing. The copy now ignores the mouse.
    - Releasing a drag clicks the card, so a click after a move of more than 4 px is ignored.
  - Grey text over a white background in the camera view had a contrast of 2.47:1. A darker backing brought it to 5.11:1, above the 4.5:1 the spec asks for.
  - On phones the help sheet opened scrolled to the bottom, because its Close button came last. Close is now at the top.
- **How it was checked:**
  - 165 unit tests in all, up from 109. The new ones cover:
    - the preset table and note frequencies;
    - the mapping and the snippet for every preset;
    - the step-hint order and the first second of sound;
    - the status words, the shortcut keys, browser storage and the code colours.
  - The agent drove headless Chromium through the sliders and a fake camera:
    - Panels: resizing, the 160 px stop, a release outside the window, unreadable saved sizes, blocked storage, and the switch to stacked panels at 720 px.
    - Sound: every preset peaks at −4.8 dBFS or lower, against a −3 dBFS limit. Average loudness is within 0.7 dB across the six at middle brightness, and within 2.9 dB at the brightest. After a switch, the old sound was 40 dB down within 64–93 ms, counting the message's trip to the audio worklet and the measuring window. No click was found at any switch.
    - Keys 1, 2 and 3 pressed within 9 ms ended on preset 3.
    - Each preset's snippet, run in Gibber 2.1.4, matched the app within 0.02 dB.
    - Dragging with real mouse events, and tapping with touch emulated.
    - The step hints with blocked storage, an unanswered camera prompt, a camera with no hand in view, an audio failure, a narrow camera view and reduced motion.
    - Every shortcut, keys held down, the Tab order with its focus outlines, and the contrast of every text colour, computed.
    - Copy, with the clipboard working, missing or refused, and the gibber.cc link opening a new tab that has no access back to this one.
- **Review:**
  - Four reviewer agents each read a different part of the code. The main agent checked every claim against the code and found no issue that needed fixing.
  - It rejected four claims:
    - a line break added at the end of one copied Resizer file;
    - a line moved by one of the listed fixes;
    - a removal that another listed fix already covers;
    - two type names nothing imports, which the rest of the code also does.
  - It noted a style rule nothing has used since milestone 1. I had it deleted.
- **Backlog:** I approved four follow-ups, all small problems on phones and for mouse-only use:
  - a visible Help button, since today only the "?" key opens the help sheet;
  - the privacy note covering the sliders at phone width;
  - "Hide code" out of sight below the presets when panels are stacked;
  - the step hint covering the camera's status card on phones.
- **Still to check before merging:**
  - 25 fps on both laptops while resizing a panel with audio on;
  - the six presets on real speakers: loudness was measured, not heard, and Deep Bass may sound quieter than it measures;
  - three people who have never seen the app, of whom at least two must make a sound within 30 seconds without help;
  - Edge, Firefox, Safari, a screen reader and a real touch screen;
  - pasting a copied snippet into gibber.cc;
  - opening gibber.cc while playing with a real hand.

### M4 — Ship
- …

## Three decisions I did not delegate
Filled in at the end of milestone 4.
