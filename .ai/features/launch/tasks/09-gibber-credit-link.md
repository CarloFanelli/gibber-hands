# Task 09: gibber-credit-link

## Objective

The live code panel's link reads "Open gibber" and opens Gibber's home page in a new tab, as a credit to the library behind the sound. Copy stays as it is.

## Context

**Satisfies**: REQ-18

Carlo asked for it on 2026-11-06: the link stops being a way to open the code in the playground and becomes a nod to Gibber. It replaces instrument-ui REQ-19. The help sheet and the README describe the link, so they change with it.

## Depends on

None

## Expected Behavior

- The link next to Copy reads "Open gibber ↗" and opens https://gibber.cc/ in a new tab.
- The new tab has no access back to the instrument's page, and the instrument keeps playing.
- The help sheet and the README call the link a credit to Gibber; neither promises a paste-and-run link any more.
- Copy, the snippet and its colours don't change.

## Acceptance Criteria

- [ ] The link reads "Open gibber" and its address is https://gibber.cc/ (REQ-18)
- [ ] It opens in a new tab with no access back to the page (REQ-18)
- [ ] The help sheet and the README describe it as a credit to Gibber, not as a way to run the code (REQ-18)
- [ ] Copy works as before (REQ-18)

## Edge Cases

- Link clicked while playing → a new tab opens; the instrument keeps playing (REQ-18)
- gibber.cc unreachable → only the new tab fails; the instrument is unaffected (REQ-18)
- Visitor wants to run the code → Copy stays; the help no longer promises a paste-and-run link (REQ-18)
- Earlier log entries name "Open gibber.cc" → left as written; the launch entry records the change (REQ-18)
