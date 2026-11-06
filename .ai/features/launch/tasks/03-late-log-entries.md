# Task 03: late-log-entries

## Objective

The process log gets a finished entry for two-hand play, note range and drum loop. Each entry says it was written after the feature ended, on which date and from which files.

## Context

**Satisfies**: REQ-11, REQ-15

All three features are finished and reviewed. The log has no two-hand play entry, and it labels the other two "(in progress)". Their specs, task notes and reviews are in the repo. The log promises entries written at the moment, so the late ones say so. The launch's own entry comes last, in Task 08.

## Depends on

None

## Expected Behavior

- Two-hand play, note range and drum loop each have a dated entry, in the order they were built, between milestone 3 and the launch.
- Each entry follows the shape of the milestone 1–3 entries: plan, decisions, what was found while building, how it was checked, review, backlog.
- Each entry opens by saying it was written or finished on that day, from the feature's spec, task notes and review.
- The notes written at the time for note range and drum loop stay word for word, and the late part follows them, marked as late.
- No "(in progress)" label is left on these three features.

## Acceptance Criteria

- [ ] Two-hand play, note range and drum loop each have a dated entry, with no "(in progress)" label left (REQ-11)
- [ ] Each entry says it was written after the feature ended, with the date and the spec, task notes and review it draws on (REQ-15)
- [ ] The note range and drum loop notes written at the time are kept word for word (REQ-15)
- [ ] Every fact in a late entry traces to that feature's spec, task notes, review or git history (REQ-15)

## Edge Cases

- A feature with no entry at all (two-hand play) → written from its spec, task notes and review alone (REQ-11)
- A partial entry written at the time (note range, drum loop) → kept word for word; the late part follows it, marked as late (REQ-15)
- The spec changed mid-feature (e.g. drum loop 1.x to 2.0) → the entry tells what was built and reviewed, and says the spec changed and why (REQ-15)
