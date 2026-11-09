---
feature: launch
spec-version: 1.4
status: approved
---

# Architecture Plan: Launch

## Technical Approach

### Overview

The launch is mostly docs, repository settings and two assets from Carlo. Only Task 02 changes the app, and only in `src/ui/styles.css`. No npm dependency is added: browser checks run in the Playwright Chromium already on this machine (`~/.cache/ms-playwright/chromium-1243`), driven from scratchpad scripts as in milestones 1–3. The GIF, the still and the video all come from one screen recording by Carlo, re-encoded with an ffmpeg kept in the scratchpad, so it isn't a project dependency. Every check that needs the live site waits until the change is pushed, and nothing is pushed without Carlo's ok.

### Shared Concerns

#### Held commits and outward actions

- **Appears in**: Task 01, Task 02, Task 04, Task 06, Task 07
- **Reference example**: SPEC.md Project Context ("Changes visible outside the repo … with Carlo's go-ahead at that moment")
- **Rule**: no commit, push, pull request or GitHub setting change without Carlo's ok in his latest message; a check that needs the live site stays "pending push", never "passed".

#### Carlo's hand-offs

- **Appears in**: Task 04 (still), Task 05 (GIF), Task 06 (checks by hand), Task 08 (three decisions)
- **Reference example**: `docs/PROCESS.md:115` and `:208` ("Still to check before merging" lists, the by-hand checks)
- **Rule**: the agent states exactly what it needs (size, length, what must show), checks what comes back against the task's criteria, and never stands in for it.

## Per-Task Technical Guidance

### Task 01: deploy-pipeline

**Files to modify:**
- None expected. `.github/workflows/deploy.yml` changes only if a check below fails.

**Evidence to collect (read-only):**
- `deploy.yml:39` `needs: build`: a failed build skips the deploy (REQ-3).
- `deploy.yml:15–17`: pushes share the `pages` group with cancel-in-progress; each pull request has its own group (REQ-2, REQ-12).
- `package.json:8`: `build` runs `tsc --noEmit` first, so typecheck runs without its own step (REQ-2).
- `gh api repos/CarloFanelli/gibber-hands/rulesets`: "main: changes through pull requests" requires check `build` and lets the admin role bypass; "main: no force-push or deletion" has no bypass (REQ-12, REQ-13).
- `gh api …/collaborators`: CarloFanelli is the only admin (REQ-13).
- `curl -I http://…`: 301 to https; Pages `https_enforced: true` (REQ-1).
- `gh run list`: failed and cancelled runs (REQ-2, REQ-3).

**Key decisions:**
- Proof by configuration and run history. A test push or test pull request is an outward action (Shared Concerns), done only if Carlo asks.

**Watch out for:**
- "Only Carlo pushes directly" rests on Carlo being the only admin, since the bypass is the admin role, not his account — `gh api …/collaborators` → the log says so; re-check if a collaborator is added.

---

### Task 02: step-hint-clearance

**Files to modify:**
- `src/ui/styles.css:123–124` — the step hint's top (44 px, 76 px with the second hand's label) becomes one custom property on `.panel-camera`, read by both rules below.
- `src/ui/styles.css:26` — while a step hint is shown, `.camera-status` starts below it: its top edge, not its padding, moves to the hint's top + its 52 px height + a 12 px gap.

**Patterns to reuse:**
- `:has()` on the panel, as `styles.css:29` and `:124` do; `createStepHints` (`src/ui/stepHints.ts`) already toggles `hidden`, so no TypeScript changes.

**Key decisions:**
- Move the scroll area's top, not its padding: with padding, scrolled cards and sliders would pass under the hint.
- The hint's height is fixed (36 px icon, 8 px padding, `nowrap`), so a constant is safe.
- No unit test: Vitest runs without a DOM. The check runs in Playwright Chromium with the camera denied, at 1536×730, 1280×720, 1920×1080, 720×480, 375×667 and 320×480. It passes when the hint's box doesn't intersect `.status-card` or `.sliders`, the last slider can be scrolled to, and with no hint the content is centred as before.

**Watch out for:**
- At 320×480 the stacked camera panel is about 160 px tall, leaving roughly 12 px of scroll strip below the hint — `styles.css:26`, `:164` → the spec allows it (still scrolls); test: reach Try again by scrolling.

---

### Task 03: late-log-entries

**Files to modify:**
- `docs/PROCESS.md` — a new "Two-hand play" entry between M3 (line 157) and "Note range" (line 216). Finish "Note range" (216) and "Drum loop" (220): keep their bullets word for word, then add the late part and drop "(in progress)".

**Sources:**
- `.ai/features/{two-hand-play,note-range,drum-loop}/`: SPEC.md (versions 1.3, 1.1, 2.0), ARCHITECTURE.md, REVIEW.md, and the "Notes from implementation" in `tasks/*.md`.
- `git log` for each feature's dates.

**Patterns to reuse:**
- The M3 entry, `docs/PROCESS.md:157–214`: Plan, Decided by me, Found while building, How it was checked, Review, Backlog.

**Key decisions:**
- Each heading carries the feature's dates from git. The late part opens with "Written on {date}, after the feature ended, from its spec, task notes and review."

**Watch out for:**
- Entries speak as Carlo ("I approved"), so a late entry may claim only decisions the files record (spec answers, approved reviews, backlog picks) — sources above → leave out anything unrecorded.

---

### Task 04: sharing

**Files to modify:**
- `index.html:6` — after `<title>`: meta description; Open Graph `og:title`, `og:description`, `og:type`, `og:url`, `og:image` with width and height; `twitter:card` = `summary_large_image`. The image URL is absolute: `https://carlofanelli.github.io/gibber-hands/social-preview.png`. Vite leaves absolute URLs as they are.

**Files to create:**
- `public/social-preview.png` — Carlo's 1200×630 still. Vite copies `public/` to the site root under the base path (`vite.config.ts`). The page never loads it, so it doesn't count toward the 2 MB page weight.

**Key decisions:**
- The still is a frame of Carlo's recording (8.0 s), scaled to 1200 px wide and cropped at the bottom to 630 px.
- The description is the repo's About description, as one line.
- About box: `gh repo edit` with `--homepage` and `--add-topic` for the seven topics, after Carlo's go-ahead. No repo file changes.
- Check after the push: `curl` the image URL (200, `image/png`), then a link-preview inspector.

**Watch out for:**
- The absolute image URL hard-codes the repo name, like `vite.config.ts` base — a rename breaks both (spec row on REQ-1) → note it beside the tag.

---

### Task 05: readme-gif

**Files to modify:**
- `README.md:5` — the TODO comment becomes the image, with alt text that describes the playing, and the video link under it.
- `.gitignore` — the original recording stays out of git (185 MB, over GitHub's 100 MB file limit).

**Files to create:**
- `docs/demo.gif` — cut from Carlo's recording. `docs/` is outside the Vite build, so it doesn't count toward the site's weight.
- `docs/demo.mp4` — the whole recording with its sound, 1920 px wide, about 6 MB.

**Key decisions:**
- The GIF is 5.5–10.5 s of the recording: a squeeze, then lanes A3, B♭3, C4 and back. 800 px wide, 12 fps, 128 colours, no dithering, which keeps the live code legible within 4 MB.
- The agent reads the GIF bytes with a scratchpad Node script: width, the sum of the frame delays, the loop block and the file size. No dependency.

**Watch out for:**
- A GIF without the looping block plays once and stops — the GIF's header → the script requires it; test: Carlo's file shows the loop block.

---

### Task 06: live-chrome-check

**Files to modify:**
- `docs/PROCESS.md:227–228` — the results replace "…" under "M4 — Ship", as a "How it was checked" list. Task 08 writes the rest of the entry around it.

**Checklist source:**
- The requirement lists of `.ai/features/{hand-tracking,hand-to-sound,instrument-ui}/SPEC.md`.
- The checks that need a hand, a camera or ears are in `docs/PROCESS.md:115`, `:150–155` and `:208–214`. Those are Carlo's.

**Agent part, in Playwright Chromium from a scratchpad script:**
- Load time on 20 Mbps with the cache off (CDP network emulation), with the fake camera showing MediaPipe's sample hand.
- Transferred bytes per origin.
- Request origins and cookies.
- The slider path with the camera denied.

**Key decisions:**
- "Tested on desktop Chrome" rests on Carlo's own Chrome. The headless runs back it up.

**Watch out for:**
- Graphics here are emulated in software, so tracking runs at 2–3 fps (`PROCESS.md:103`) and the first-hand time measured here comes out high → Carlo's laptop gives the figure that goes in the log.

---

### Task 07: readme-status

**Files to modify:**
- `README.md:9` — the status says the site is live, lists what is built and says "Tested on desktop Chrome."; the sentence about the launch in progress goes.
- `README.md:11–40` — "How to play", re-read against `src/ui/helpSheet.ts`, `src/ui/shortcuts.ts` and `src/ui/gestureGuide.ts`.
- A "Known limitations" section only if Task 06 left a failure unfixed.

**Key decisions:**
- The link check is a scratchpad script:
  - http(s) links: `curl` returns 200;
  - relative links: the file exists on the pushed main;
  - `#` anchors: they match GitHub's heading slugs.

**Watch out for:**
- Relative links to `.ai/features/…` and `docs/demo.gif` resolve on github.com only after the push — check the pushed main, not the working tree.

---

### Task 08: launch-log-entry

**Files to modify:**
- `docs/PROCESS.md:227` — the dated "M4 — Ship" entry, written around Task 06's results.
- `docs/PROCESS.md:231` — Carlo's three decisions replace "Filled in at the end of milestone 4."

**Patterns to reuse:**
- The M3 entry's shape, `docs/PROCESS.md:157–214`.

**Key decisions:**
- The agent drafts the entry from spec 1.2, the task notes and the session, and Carlo approves it.
- For the three decisions, the agent lists up to five candidates from the log, each with its line, and Carlo writes the words. Examples: the camera asked for on page load, six presets, drums by buttons after playing the gesture version, the Chrome-only claim.

---

### Task 09: gibber-credit-link

**Files to modify:**
- `src/ui/liveCode.ts:19` — the link's text becomes "Open gibber" and its address https://gibber.cc/; `target` and `rel` stay. The header comment says what the link is now.
- `src/ui/helpSheet.ts:59` — the "Open gibber.cc" entry becomes "Open gibber", described as Gibber's home page, the library behind the sound.
- `README.md:38` — the live-code line keeps Copy and calls the link a credit to Gibber.

**Key decisions:**
- No unit test: Vitest runs without a DOM and no test names the link. The check is the built page in Playwright Chromium: link text, address, `target` and `rel`.
- Earlier PROCESS.md entries stay as written (REQ-11 edge cases); the launch entry (Task 08) records the change.

