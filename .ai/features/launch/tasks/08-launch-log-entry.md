# Task 08: launch-log-entry

## Objective

PROCESS.md closes with the launch's entry, written when the launch ends, and the three decisions Carlo did not delegate, in Carlo's words. No "…" and no "Filled in at the end of milestone 4" line is left.

## Context

**Satisfies**: REQ-11, REQ-14, REQ-16

These are the two parts a technical reader looks for first, and both are empty today. The entry is written at the moment the launch ends, so this task comes last. The agent may suggest candidates for the three decisions from the log; the final words are Carlo's.

## Depends on

- Task 01
- Task 02
- Task 03
- Task 04
- Task 05
- Task 06
- Task 07

## Expected Behavior

- A dated "M4 — Ship" entry replaces "…", shaped like the milestone 1–3 entries.
- It records the browser decision (Chrome only; Edge, Firefox and Safari out of the launch and not tracked), the step hint fix, the GIF, the README status, the link preview, the About box and the late entries.
- It says the step hint overlap showed in any window too short for the card and the sliders, seen at 1536 px wide, not only on phones.
- "Three decisions I did not delegate" holds three decisions written by Carlo, in place of "Filled in at the end of milestone 4".
- Earlier entries stay as written.

## Acceptance Criteria

- [ ] The launch entry is dated and replaces "…"; no "…" or "(in progress)" is left in PROCESS.md (REQ-11)
- [ ] The entry says the Edge, Firefox and Safari checks were taken out of the launch, and why (REQ-14)
- [ ] The entry says the overlap showed in any window too short for the card and sliders, seen at 1536 px wide (REQ-11)
- [ ] "Three decisions I did not delegate" holds three decisions in Carlo's words, replacing the placeholder line (REQ-16)
- [ ] The milestone 1–3 entries are unchanged (REQ-11)

## Edge Cases

- Launch entry → written when the launch closes, at that moment: README, About box, overlap fix, browser decision (REQ-11)
- The milestone 3 entry calls the overlap phone-only → left as written; the launch entry says it shows in any window too short for the card and sliders, seen at 1536 px wide (REQ-11)
- Milestone 2 and 3 entries list Edge, Firefox and Safari as "still to check" → left as written; the launch entry says those checks were taken out of the launch (REQ-14)
- The three decisions not written yet → milestone 4 isn't done (REQ-16)
- Agent asked to write the three decisions → it may suggest candidates from the log; the final words are Carlo's (REQ-16)
