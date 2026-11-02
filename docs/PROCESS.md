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

### M1 — Tracking
- …

### M2 — Sound
- …

### M3 — Instrument UI
- …

### M4 — Ship
- …

## Three decisions I did not delegate
Filled in at the end of milestone 4.
