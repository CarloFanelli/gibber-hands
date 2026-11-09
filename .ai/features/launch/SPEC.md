---
feature: launch
version: 1.4
status: approved
base: 8e6151cbefced46cc1899a80610dd5526752d4c7
completed: false
---

# Launch

## Overview

This milestone ships gibber-hands. GitHub Actions deploys the site to GitHub Pages on every push to main, and only when typecheck, tests and build pass. A pull request runs the same checks and can't merge until they pass. On the live site, the first three milestones are re-checked in desktop Chrome only, and the README claims no other browser. The README opens with a silent 5-second GIF of a hand playing and links the live demo. Shared links get a title, a description and a preview image, and nothing is tracked. The step hint stops covering the camera's status card. PROCESS.md gets a finished entry for every feature and the three decisions Carlo didn't delegate.

## Project Context

- Pages is enabled with Source set to GitHub Actions. The site is live with HTTPS enforced (checked 2026-11-06).
- The repo is public, as GitHub Pages on a free plan requires.
- The site lives under `/gibber-hands/`, so every asset path depends on the repository name.
- The camera needs HTTPS, which github.io provides.
- The GIF and the preview need Carlo's hand and camera, so Carlo records them.
- Changes visible outside the repo (editing the About box) happen with Carlo's go-ahead at that moment.
- Version 1.1 added the pull-request check and the rules on main: Carlo pushes to main directly, everyone else opens a pull request.
- Version 1.2 narrows the browser check to Chrome (no other browser was ever tried), absorbs the step hint overlap (B-12), and logs all seven features.
- Version 1.3 turns the playground link (instrument-ui REQ-19) into a credit to Gibber: "Open gibber", to gibber.cc's home page. Copy stays.
- Version 1.4 adds a demo video with sound, linked under the GIF. Carlo records it; the GIF and the still are cut from that recording.

## Functional Requirements

### Deploy

- REQ-1: The site is published at https://carlofanelli.github.io/gibber-hands/ over HTTPS, deployed by GitHub Actions from main.
- REQ-2: Every push to main runs typecheck, tests and build; the site deploys only if all three pass.
- REQ-3: A failed run leaves the previously deployed site live and unchanged.
- REQ-12: A pull request to main runs typecheck, tests and build, and GitHub refuses to merge it until all three pass. A pull request never deploys.
- REQ-13: Only Carlo pushes to main directly; anyone else changes it through a pull request. Nobody can force-push to main or delete it.
- REQ-4: On the live site, milestone 1–3 requirements are re-checked in current desktop Chrome, results logged in PROCESS.md.

### README

- REQ-5: The README opens with a silent, looping 5-second GIF of a hand playing, at most 800 px wide and 4 MB.
- REQ-6: The GIF shows the overlay, a lane change, a squeeze and the live code updating.
- REQ-19: Right under the GIF, the README links a demo video with sound, kept in the repo.
- REQ-7: The README's status, live demo link and "How to play" match the shipped behavior, with no "planned" or "in progress" labels left.
- REQ-14: The README names only browsers actually checked on the live site, "Tested on desktop Chrome." today, and promises no future checks.
- REQ-8: Next to the pre-AI toolbox, a "New in gibber-hands" section lists techniques this project added, each linked to its file.

### Sharing

- REQ-9: Shared links show the title, a one-line description and a 1200×630 still from the demo.
- REQ-10: The repository's About box shows the live site URL and the topics mediapipe, gibber, web-audio, typescript, gesture-recognition, creative-coding and claude-code.

### Process log

- REQ-11: PROCESS.md has a finished, dated entry for each of the seven features, launch included, with no "…" or "(in progress)" left.
- REQ-15: An entry written or finished after its feature ended says so, with the date and the spec, task notes and review it draws on.
- REQ-16: The "three decisions I did not delegate" are written by Carlo and replace the "Filled in at the end of milestone 4" line.

### Camera view

- REQ-17: In any window from 320×480 px up, the step hint covers no part of a camera status card or the sliders.

### Credit to Gibber

- REQ-18: The live code panel's "Open gibber" link opens https://gibber.cc/ in a new tab; help and README call it a credit to Gibber.

## Data & Dependencies

### External capabilities relied on

- Static hosting with HTTPS — GitHub Pages.
- Build and deploy on every push — GitHub Actions.
- Hosted hand model and MediaPipe runtime files — Google's model storage and the jsDelivr CDN, as in the hand-tracking spec.

## Non-Functional Requirements

- **Performance** — On the live site, a first visit reaches the first tracked hand in ≤ 10 s on 20 Mbps with an empty cache. This re-measures the hand-tracking target.
- **Performance** — The page and its own files weigh ≤ 2 MB, not counting the hand model and the MediaPipe runtime files.
- **Security** — No analytics and no cookies. The live site contacts only its own address, Google's model storage and jsDelivr, checked in the browser's network panel.
- **Security** — The site is served only over HTTPS.
- **Validation** — Every README link (lineage permalinks, live demo, docs, spec folders) opens without a 404, checked before announcing.

## Edge Cases & Error Handling

| Edge Case | Expected Behavior | Relates to |
|-----------|-------------------|------------|
| Pages not enabled yet | The deploy job fails with a clear error; enabling Pages and re-running fixes it | REQ-1 |
| Site opened over http:// | Redirected to https:// | REQ-1 |
| Repository renamed | Asset paths break; the base path in the build config must change together with the name | REQ-1 |
| Docs-only push | The full pipeline runs anyway | REQ-2 |
| Two pushes in quick succession | The older run is cancelled; the newer one deploys | REQ-2 |
| A test fails | No deploy; the previous version stays live; the failed run is visible in Actions | REQ-3 |
| GitHub Actions outage | Site unchanged until a later run succeeds | REQ-3 |
| Pull request from a fork | The check runs with read-only access and deploys nothing | REQ-12 |
| A pull request's check fails | GitHub refuses the merge; the live site stays as it is | REQ-12 |
| New push to an open pull request | Its older check is cancelled; a deploy in progress is not | REQ-12 |
| Check required before the workflow runs on pull requests | Every pull request would wait forever, so GitHub requires the check only once the workflow change is on main | REQ-12 |
| Carlo pushes to main directly | Allowed, flagged by GitHub as a bypassed rule; the push deploys as before | REQ-13 |
| Force-push or deletion of main, by anyone | Refused; a history rewrite first needs Carlo to switch that rule off | REQ-13 |
| A Chrome check fails on the live site | Fixed before launch, or listed under "Known limitations" in the README with what fails | REQ-4 |
| Machine without a camera | The slider path is checked instead | REQ-4 |
| GIF over 4 MB | Re-encoded (fewer colours or frames) before commit | REQ-5 |
| GIF path | Stored in the repo and linked relatively, so it renders on github.com | REQ-5 |
| The README's "TODO … GIF goes here" comment | Replaced by the GIF; no TODO comment left in the README | REQ-5 |
| Recording shows something private (notifications, other tabs) | Re-recorded | REQ-6 |
| N/A — network: the GIF is a file in the repo | — | REQ-6 |
| Original recording over GitHub's 100 MB file limit | The repo keeps a re-encoded MP4; the original stays out of git | REQ-19 |
| Video link path | Relative, like the GIF, and checked on github.com after the push | REQ-19 |
| Recording shows something private | Re-recorded, as for the GIF | REQ-19 |
| Behavior changed while tuning after launch | README updated in the same commit as the change | REQ-7 |
| Live demo link | Opened and checked on the live site before announcing | REQ-7 |
| Status written while the launch is still open | Rewritten in the change that closes the launch: it says the site is live, with no milestone in progress | REQ-7 |
| Someone later tries Edge, Firefox or Safari | The README adds each browser that passed, in the same change as its PROCESS.md line | REQ-14 |
| Milestone 2 and 3 entries list Edge, Firefox and Safari as "still to check" | Left as written; the launch entry says those checks were taken out of the launch | REQ-14 |
| Technique already in the pre-AI toolbox (e.g. pinch) | Listed as new only for what changed (scaling by hand size), with a pointer to the original | REQ-8 |
| Linked file renamed later | The link check before announcing catches it | REQ-8 |
| Preview image given as a relative path | Absolute URL, since link-preview crawlers need one | REQ-9 |
| A platform shows an old preview from its cache | Refreshed through that platform's preview inspector; outside the site's control | REQ-9 |
| Topics with spaces or capitals | Lowercase and hyphenated, as GitHub requires; the seven listed already are | REQ-10 |
| Site not live yet | The About URL is set after the first successful deploy; true since 2026-11-05 | REQ-10 |
| Agent asked to edit the About box | Only with Carlo's go-ahead in that session; the existing description stays | REQ-10 |
| Launch entry | Written when the launch closes, at that moment: README, About box, overlap fix, browser decision | REQ-11 |
| A feature with no entry at all (two-hand play) | Written from its spec, task notes and review alone | REQ-11 |
| The milestone 3 entry calls the overlap phone-only | Left as written; the launch entry says it shows in any window too short for the card and sliders, seen at 1536 px wide | REQ-11 |
| A partial entry written at the time (note range, drum loop) | Kept word for word; the late part follows it, marked as late | REQ-15 |
| The spec changed mid-feature (e.g. drum loop 1.x to 2.0) | The entry tells what was built and reviewed, and says the spec changed and why | REQ-15 |
| The three decisions not written yet | Milestone 4 isn't done | REQ-16 |
| Agent asked to write the three decisions | It may suggest candidates from the log; the final words are Carlo's | REQ-16 |
| Card and sliders taller than the room under the step hint (camera blocked, 1536 px wide) | They start below the step hint and scroll there; the step hint stays where it is | REQ-17 |
| No step hint shown (steps done, or hints stopped after the first sound) | Card and sliders use the camera view's full height, centred as today | REQ-17 |
| The second hand's label pushes the step hint lower | Card and sliders start below the step hint's new place | REQ-17 |
| The step changes while a card is shown (e.g. "Start audio" to the squeeze step) | No overlap at any step | REQ-17 |
| Hand model card shown with the camera card (e.g. no network) | Both cards and the sliders start below the step hint | REQ-17 |
| A panel resized, or the window crossing into stacked panels, while a card is shown | No overlap after the change | REQ-17 |
| Window under 320×480 px | Outside this guarantee; card and sliders still scroll | REQ-17 |
| Link clicked while playing | A new tab opens; the instrument keeps playing | REQ-18 |
| The new tab | Has no access back to the instrument's page | REQ-18 |
| gibber.cc unreachable | Only the new tab fails; the instrument is unaffected | REQ-18 |
| Visitor wants to run the code | Copy stays; the help no longer promises a paste-and-run link | REQ-18 |
| Earlier log entries name "Open gibber.cc" | Left as written; the launch entry records the change | REQ-18 |

## Out of Scope

- **Video playing inside the README** — the GIF is what plays there; the video with sound is a link under it (REQ-19).
- **Analytics or visit counting** — a page that asks for the camera sends nothing anywhere.
- **Custom domain** — the github.io address is enough for a portfolio link.
- **Versioned releases and a changelog** — the live site is the product, and the history lives in git and PROCESS.md.
- **Offline support (model files served from the site)** — CLAUDE.md reserves it for "if ever needed".
- **Performance tuning for phones** — phones have no targets in this project.
- **The repository's own social preview image** — it's set by hand in the repository settings, and the site's link preview covers the shared demo link.
- **Checks in Edge, Firefox and Safari** — nobody has run them, and the README claims only what was checked. Carlo chose not to track them in the backlog.
- **Other overlaps in the camera view (the privacy note over the sliders on phones, B-10)** — stays in the backlog; this launch fixes only the overlap seen on a laptop.
- **Rewriting earlier log entries** — entries written at the moment stay as written; later entries correct them.
