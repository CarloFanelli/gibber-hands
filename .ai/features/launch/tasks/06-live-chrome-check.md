# Task 06: live-chrome-check

## Objective

On the live site, in current desktop Chrome, the milestone 1–3 requirements and the launch's speed, weight and privacy targets are checked again, with the results logged in PROCESS.md.

## Context

**Satisfies**: REQ-4

Carlo chose Chrome only: Edge, Firefox and Safari were never tried, and they're out of the launch. The check runs on the deployed site, so the step hint fix (Task 02) counts only once it is pushed. The checks that need a real hand and camera are Carlo's. Load time, weight, requests and the slider path can be measured by the agent.

## Depends on

- Task 02

## Expected Behavior

- Each milestone 1–3 requirement gets a pass or a fail from the live site in current desktop Chrome.
- The log says for each check who ran it and how: the agent in headless Chrome, or Carlo by hand.
- A first visit with an empty cache on 20 Mbps reaches the first tracked hand in 10 s or less.
- The page and its own files weigh 2 MB or less, not counting the hand model and the MediaPipe runtime files.
- The browser's network panel shows requests only to the site, Google's model storage and jsDelivr, and the site sets no cookie.
- A failure is fixed before launch, or recorded for the README's "Known limitations" with what fails.

## Acceptance Criteria

- [ ] Every milestone 1–3 requirement has a pass or fail from the live site in current desktop Chrome, logged in PROCESS.md (REQ-4)
- [ ] A first visit, empty cache, 20 Mbps, reaches the first tracked hand within 10 s (REQ-4, Performance)
- [ ] The page and its own files weigh at most 2 MB, hand model and MediaPipe runtime excluded (REQ-4, Performance)
- [ ] Requests go only to the site, Google's model storage and jsDelivr, and no cookie is set (REQ-4, Security)
- [ ] Each failure is fixed, or recorded for "Known limitations" with what fails (REQ-4)

## Edge Cases

- A Chrome check fails on the live site → fixed before launch, or listed under "Known limitations" in the README with what fails (REQ-4)
- Machine without a camera → the slider path is checked instead (REQ-4)

## Notes from implementation

- **Known limitation**: the 10-second first-visit target (AC 2) is not judged yet. In headless Chrome on this machine, with an empty cache on 20 Mbps, every download finished at 7.0 s but the first tracked hand came at 17.7 s (15.8 s without the speed limit). Graphics are emulated in software here, so model start-up and tracking are far slower than on a real laptop: tracking ran at 2 frames a second at most, under one with a hand in view, where the frame-rate label showed "— fps" as designed. Carlo's own Chrome gives the figure of record. If it is over 10 s, it goes under "Known limitations" in the README. /dev, 2026-11-06.
