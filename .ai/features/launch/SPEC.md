---
feature: launch
version: 1.1
status: approved
completed: false
---

# Launch

## Overview

This milestone ships gibber-hands. GitHub Actions deploys the site to GitHub Pages on every push to main, and only when typecheck, tests and build pass. A pull request runs the same checks and can't merge until they pass. On the live site, the targets of the three earlier specs are measured again in four desktop browsers. The README opens with a silent 5-second GIF of a hand playing, shows the final controls and links the live demo. It also adds a "New in gibber-hands" list next to the pre-AI toolbox. Shared links get a title, a description and a preview image, and nothing is tracked. PROCESS.md closes with a log entry per milestone and the three decisions Carlo didn't delegate.

## Project Context

- The deploy workflow already exists. Pages must be enabled with Source set to GitHub Actions.
- The repo is public, as GitHub Pages on a free plan requires.
- The site lives under `/gibber-hands/`, so every asset path depends on the repository name.
- The camera needs HTTPS, which github.io provides.
- The GIF and the preview still need Carlo's hand and camera, so Carlo records them.
- Changes visible outside the repo (enabling Pages, editing the About box) happen with Carlo's go-ahead at that moment.
- Version 1.1 adds the pull-request check and records the rules on main that Carlo asked for: he pushes to main directly, everyone else opens a pull request.

## Functional Requirements

### Deploy

- REQ-1: The site is published at https://carlofanelli.github.io/gibber-hands/ over HTTPS, deployed by GitHub Actions from main.
- REQ-2: Every push to main runs typecheck, tests and build; the site deploys only if all three pass.
- REQ-3: A failed run leaves the previously deployed site live and unchanged.
- REQ-12: A pull request to main runs typecheck, tests and build, and GitHub refuses to merge it until all three pass. A pull request never deploys.
- REQ-13: Only Carlo pushes to main directly; anyone else changes it through a pull request. Nobody can force-push to main or delete it.
- REQ-4: On the live site, milestone 1–3 requirements are re-checked in current desktop Chrome, Edge, Firefox and Safari, results logged in PROCESS.md.

### README

- REQ-5: The README opens with a silent, looping 5-second GIF of a hand playing, at most 800 px wide and 4 MB.
- REQ-6: The GIF shows the overlay, a lane change, a squeeze and the live code updating.
- REQ-7: The README's status, live demo link and "How to play" match the shipped behavior, with no "planned" labels left.
- REQ-8: Next to the pre-AI toolbox, a "New in gibber-hands" section lists techniques this project added, each linked to its file.

### Sharing

- REQ-9: Shared links show the title, a one-line description and a 1200×630 still from the demo.
- REQ-10: The repository's About box shows the live site URL and topics.

### Process log

- REQ-11: PROCESS.md has a log entry for each milestone and the "three decisions I did not delegate", written by Carlo.

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
| A browser fails a check | Fixed before launch, or listed under "Known limitations" in the README with what fails | REQ-4 |
| Machine without a camera | The slider path is checked instead | REQ-4 |
| GIF over 4 MB | Re-encoded (fewer colours or frames) before commit | REQ-5 |
| GIF path | Stored in the repo and linked relatively, so it renders on github.com | REQ-5 |
| Recording shows something private (notifications, other tabs) | Re-recorded | REQ-6 |
| N/A — network: the GIF is a file in the repo | — | REQ-6 |
| Behavior changed while tuning after launch | README updated in the same commit as the change | REQ-7 |
| Live demo link | Opened and checked on the live site before announcing | REQ-7 |
| Technique already in the pre-AI toolbox (e.g. pinch) | Listed as new only for what changed (scaling by hand size), with a pointer to the original | REQ-8 |
| Linked file renamed later | The link check before announcing catches it | REQ-8 |
| Preview image given as a relative path | Absolute URL, since link-preview crawlers need one | REQ-9 |
| A platform shows an old preview from its cache | Refreshed through that platform's preview inspector; outside the site's control | REQ-9 |
| Topics with spaces or capitals | Lowercase and hyphenated, as GitHub requires | REQ-10 |
| Site not live yet | The About URL is set after the first successful deploy | REQ-10 |
| The three decisions not written yet | Milestone 4 isn't done | REQ-11 |
| Agent asked to write the three decisions | It may suggest candidates from the log; the final words are Carlo's | REQ-11 |

## Out of Scope

- **Video with sound in the README** — GIF only, as planned. The live demo plays the sound.
- **Analytics or visit counting** — a page that asks for the camera sends nothing anywhere.
- **Custom domain** — the github.io address is enough for a portfolio link.
- **Versioned releases and a changelog** — the live site is the product, and the history lives in git and PROCESS.md.
- **Offline support (model files served from the site)** — CLAUDE.md reserves it for "if ever needed".
- **Performance tuning for phones** — phones have no targets in this project.
- **The repository's own social preview image** — it's set by hand in the repository settings, and the site's link preview covers the shared demo link.
