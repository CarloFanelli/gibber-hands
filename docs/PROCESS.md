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

### Two-hand play (2026-11-04 to 2026-11-05)

*Written on 2026-11-06, after the feature ended, from its [spec](../.ai/features/two-hand-play/SPEC.md), task notes and review. No notes were taken at the time.*

- **Why:** it picks up two follow-ups from the first interviews, playing with two hands and setting the effect amount by hand. The launch waited for it.
- **What it adds** (21 requirements):
  - The second hand plays notes too, so two notes can sound at once.
  - A Victory sign switches the second hand to shape mode. There, a held squeeze lifts every note an octave, and its height sets the reverb or echo amount.
  - A swap control serves left-handed players, and one more step hint teaches the switch.
- **Plan:** six tasks:
  - both hands tracked;
  - two notes at once;
  - the octave squeeze;
  - the effect by height;
  - shape controls on the sliders;
  - guidance for the second hand.

  The technical plan added four edge cases from the code. One of them: a hand that leaves showing the Victory sign and comes back still showing it counts as one new sign.
- **Changed during the work, and agreed with me** (spec 1.0 to 1.3):
  - The octave's level check. Single upper notes on Warm Pad differ by up to 6.7 dB from the same lane below, because of the preset's reverb. The check became the average over a preset's eight lanes, and it holds on every preset (worst gap 1.1 dB).
  - With the effect amount added, the second hand's labels in shape mode were 487 px long. On a phone they ran over the frame rate. Below 560 px they now show icons and numbers, and wrap to a second line.
  - The shape step hint used up its 10 seconds while the hand model was still loading. Its time now counts only while a hand is in view.
- **Tuned by ear, but not heard yet:** the effect amount glides over 50 ms, and the octave drops back at pinch 0.3. Both are starting values. The glide was checked for zipper noise by measurement only.
- **How it was checked:**
  - 219 unit tests in all, up from 165.
  - The agent drove headless Chromium, with MediaPipe's sample photos as the camera:
    - which hand the model calls right;
    - two hands sounding without a break, with processor load going from 0.39 to 0.43 cores for 12 voices;
    - the labels at six widths, from 300 to 620 px.
  - The live code ran on the app's own Gibber and matched the app within 0.012 dB, except Blues Reed: it can differ by up to 0.13 dB, because Gibber's own mix moves by that much.
- **Review:**
  - One must-fix: during a camera or hand-model retry, the sliders' shaping hand played notes at full volume. Shape mode now follows where the hands come from, not the status words.
  - One nit: a label was rewritten on every frame.
  - Both were fixed in one commit, and a re-check approved it.
- **Backlog:** I approved three follow-ups:
  - every note an octave lower, done in note range;
  - a preset for each hand, still open;
  - a drum loop, done in drum loop.
- **Still to check by hand:**
  - the frame rate with two hands and audio on, on both laptops;
  - a real right hand lighting the right-hand label;
  - the two-voice code pasted at gibber.cc;
  - the 50 ms glide, by ear.

### Note range (2026-11-05)

- **Decided by me during the work:** in the octave-down task, the darkest-brightness check missed its 3 dB target on two presets. With the octave lowered, Blues Reed played 4.5 dB louder on average over its eight lanes, and Brass 3.2 dB. I kept the sound as built, each lower note half as bright, and relaxed the check to 5 dB (spec version 1.1). Neighbouring lanes in the normal octave already differ by up to 11 dB.

*The rest was written on 2026-11-06, after the feature ended, from its [spec](../.ai/features/note-range/SPEC.md), task notes and review.*

- **What it adds** (16 requirements):
  - More note lanes on a wider camera picture: one per 80 px of playing zone, from 8 up to 16.
  - A thumbs-down held by the second hand in shape mode plays every note an octave lower. This picks up a follow-up from two-hand play.
  - A gesture guide below the live code, with a divider between the two. "Hide code" now hides only the code.
- **Plan:** five tasks:
  - more note lanes;
  - the octave-down sign;
  - the octave choice on the sliders;
  - the gesture guide;
  - the divider.
- **Tuned by ear, but not heard yet:** the 80 px lane width, a starting value.
- **How it was checked:**
  - 250 unit tests in all, up from 219.
  - The agent drove headless Chromium with a stand-in camera:
    - The lane count followed the picture's width at five window sizes, while a bar was dragged, after a reload and with stacked panels.
    - The hand model named an upside-down thumbs-up photo "Thumb down" at 95%. It lowered the octave only for the shaping hand, not for a hand playing notes.
    - Two hands at full squeeze, brightest, on lanes 15 and 16, peaked at −3.8 dBFS or lower on every preset.
    - Assistive tools see the divider as "Resize code and gesture guide". A finger drag worked with emulated touch.
- **Review:**
  - One should-fix: when the camera worked but the hand model had failed, the guide said "No camera". It now says the sliders stand in for the hand, without naming a cause.
  - One nit: right after a change in the lane count, the lit lanes were drawn from the old count.
  - Both were fixed in one commit, and a re-check approved it.
- **Still to check by hand:**
  - 16 lanes with a real hand on both laptops;
  - the thumbs-down with a real hand;
  - the divider with a screen reader and on a phone;
  - the code with the octave lowered, pasted at gibber.cc.

### Drum loop (2026-11-05)

- **Proposed by the agent, rejected after I played it:** spec 1.x let the second hand steer the drums. A rock sign 🤟 switched it to drum mode, where its palm center picked one of four drum patterns, its height set 1 to 4 drum layers, and a closed fist muted the drums. It was built and tested through task 05. When I played it, changing the beat by hand didn't work.
- **Decided by me:** buttons beside "Start drums" replace it (spec 2.0). ◀ and ▶ step through the patterns and − and + set the layers. I dropped the mute, since "Stop drums" ends the beat, and kept the D key for start and stop only.
- **What went with it:** drum mode and the mute; the camera view's drum label; the band rule the note lanes had shared with the hand's pattern and height bands; and the planned slider drum controls. The buttons work without a camera, so the no-camera path needs nothing of its own. The help-sheet task stays, without drum gestures.
- The agent checked the buttons in headless Chromium without a camera: wrap-around, the layer bounds, choices made while stopped, and the live code changing a bar after the panel.

*The rest was written on 2026-11-06, after the feature ended, from its [spec](../.ai/features/drum-loop/SPEC.md), task notes and review.*

- **What it adds** (13 requirements in spec 2.0):
  - A drum loop to play over. Buttons start and stop it, and step through four drum patterns, Rock, House, Hip-hop and Breakbeat, each at its own tempo.
  - Buttons add or remove drum layers, and the D key starts and stops the loop.
  - The echo follows the drum tempo, and the live code plays the same beat.

  This picks up the rhythm follow-up from two-hand play.
- **Plan:** seven tasks at first. Spec 2.0 removed three: the drum-mode switch, the fist mute and the slider drum controls. A buttons task took their place, leaving five.
- **Changed during the work:**
  - The D key now acts while the help sheet is open, as 1–6 and C already did. The spec had assumed those keys were ignored there (spec 1.1, agreed in the technical plan).
  - A tempo change glides the echo time over 250 ms, a new value tuned by ear, because a jump clicks. Echoes ringing during the glide bend in pitch, like a tape echo.
- **Tuned by ear, but not heard yet:** the drum mix, the House, Hip-hop and Breakbeat hits, the open hi-hat and the 250 ms glide. They were set by measurement or from the spec's tables, not by listening. Four drum layers peak at −6.9 dBFS alone, and under −3 dBFS with two loud hands.
- **How it was checked:**
  - 297 unit tests in all, up from 250.
  - Buttons, in headless Chromium without a camera:
    - − and + stop at 1 and 4;
    - a choice made while stopped plays on the next start;
    - the panel names a pattern at once, while the live code follows a bar later;
    - the Tab order, and the layout at 1280 and 390 px.
  - The drum code ran on the app's own Gibber 2.1.4. Every pattern tried played the app's steps and loudness at the right tempo. In 5 runs of 6, all drums started within 4 samples of each other. In the sixth, snare and hi-hats came 9 ms after the kick.
- **Review:**
  - Three nits, all left over from removing drum mode: a test name, note-lane comments still worded for the removed bands, and lines rewritten with no change in behavior.
  - They were fixed in one commit, and the review approved it.
- **Still to check by hand:**
  - listening to the drum mix and the three newer patterns;
  - pasting the drum code at gibber.cc.

### M4 — Ship (2026-11-05 to 2026-11-09)
- **What shipped:**
  - **Deploy:** every push to main runs typecheck, tests and build, and deploys only if all three pass. A pull request runs the same checks and never deploys. I push to main directly; everyone else goes through a pull request.
  - **Browsers:** I took the Edge, Firefox and Safari checks out of the launch and chose not to track them. Nobody had run them, and the README claims only what was checked. The earlier entries that list them as "still to check" stay as written.
  - **Step hint overlap:** the M3 entry calls it phone-only. It shows in any window too short for the card and the sliders, and I saw it at 1536 px wide. Card and sliders now start below the step hint.
  - **Credit to Gibber:** "Open gibber.cc" became "Open gibber", a link to gibber.cc's home page. Copy stays.
  - **Link preview and About box:** shared links get a title, a description and a 1200×630 still. The About box has the site's address and the seven topics.
  - **Late entries:** two-hand play, note range and drum loop got their entries after those features ended, and each entry says so.
- **Demo (2026-11-09):** I recorded one 29-second take of the app, and the GIF, the link preview and the video all come from it. The first GIF came out at 5.7 MB, so it went down to 12 fps and 128 colours to fit the 4 MB limit. The spec had ruled out a video with sound, and I changed my mind: the README now links one under the GIF (launch 1.4, REQ-19). The GIF is still the only thing that plays in the README. GitHub's file page refused to show a video that big, so the site serves it (launch 1.5).
- **How it was checked:** on the live site, in desktop Chrome only. Edge, Firefox and Safari were not tried.
  - **By me, by hand,** in my desktop Chrome after the step-hint fix went live (2026-11-06): ok. The requirements that need a real hand, a camera or ears rest on that pass, with the 297 unit tests behind them:
    - hand tracking: one reading per frame, the 150 ms hold, palm center, pinch, the gesture debounce and the frame rate (REQ-6 to 9, 11 and 15);
    - sound: lane borders, the glide, brightness, the volume curve, the fist, a lost hand, the sound chain, the gibber.cc paste, and the sliders sounding like the camera (REQ-6, 7, 9 to 14, 16 and 17);
    - instrument UI: the preset crossfade and the six presets heard (REQ-7 and 8).
  - **By the agent, in headless Chrome** driven by a script against the live site. A fake camera showed MediaPipe's own sample hand photos to the real model. For the slider path the camera was refused.
    - Hand tracking, all passed (REQ-1 to 5, 10, 13, 14, 16 and 17): the mirrored full frame; the blocked-camera message, and Try again starting the camera without a reload; model progress from 0% to 99%; the card when the model can't load; gestures at pointing up 85%, thumb up 69%, victory 79% and closed fist 92%; "Raise your hand" with no hand in view; the overlay staying on the hand when the panel was widened; and the sliders by keyboard.
    - Sound, all passed (REQ-1 to 3 and 15): no audio before the click; Start and Stop; the failure card with the sound worklet blocked; the live code rewritten 18 times in 2 seconds of slider moves, under the limit of 10 a second.
    - Instrument UI, all passed (REQ-1 to 6, 9, 10 and 12 to 20): panels side by side and their sizes back after a reload; the code hidden by the button and the C key; panels stacked at 719 px and side by side at 720 px; six presets chosen by click, by drag and by key; Saw Lead on a first visit and the last choice after a reload; lane names following the preset; the status words; the four step hints in order, gone for good after a second of sound; the help sheet; the shortcuts; Copy and "Copied" for 2 seconds; the gibber.cc link in a new tab; the code colours.
    - "Start audio" before audio starts (UI REQ-11) is the largest control and the only filled one: it stands out from the panel at 10.7:1, every other control at 1.7:1. Its dark text on that fill reaches 11.5:1, though, below the 15.1:1 of the light text on the other buttons. I read "highest contrast" as the button against the panel, so it passes.
    - A first visit with an empty cache on 20 Mbps: the site's own files weigh 175 KB, against 2 MB allowed. Requests went only to the site, Google's model storage and jsDelivr, and no cookie was set. The one failed request was the browser asking for a favicon the site doesn't have. I put adding one in the backlog.
  - **Replaced by later features,** and checked in their newer form: one tracked hand (tracking REQ-12) by two-hand play; the fixed 8 lanes and the single scale (sound REQ-4, 5 and 8) by note range and the presets; hiding the whole code panel (UI REQ-3) by note range.
  - **Not judged on the agent's machine:** speed. Its graphics are emulated in software, so tracking ran at 2 frames a second at most. With a hand in view it fell under one, and the label showed "— fps". The first tracked hand came at 17.7 s: every download had finished at 7.0 s, and the rest went to starting the model.
  - **First visit, on my laptop (2026-11-09):** about 7–8 s to the first tracked hand, timed by stopwatch in Chrome with the cache disabled and the network limited to 20 Mbps. About 1 s of that comes after the model has loaded. The target is 10 s, so nothing goes under "Known limitations".
  - **README links:** all 41 opened without a 404, checked on the pushed main.

## Three decisions I did not delegate

1. **Drums by buttons, after playing the gesture version.** The agent proposed steering the drums with the second hand: a rock sign 🤟 for drum mode, the palm center to pick the pattern, its height to set the layers. It was built and tested through five tasks. When I played it, changing the beat by hand didn't work, so buttons beside "Start drums" replaced it ([drum loop](#drum-loop-2026-11-05)).
2. **The camera on page load.** The agent proposed one Start button that would ask for the camera and start audio together. I chose to ask for the camera as soon as the page opens, and to keep only audio behind a click ([the four specs](#2026-11-02--the-four-specs)).
3. **The lower octave kept as it sounds.** With the octave lowered and the brightness at its darkest, Blues Reed played 4.5 dB louder than the normal octave and Brass 3.2 dB, over the 3 dB limit. I kept the sound as built instead of reshaping it to pass, and relaxed the check to 5 dB, since neighbouring lanes in the normal octave already differ by up to 11 dB ([note range](#note-range-2026-11-05)).
