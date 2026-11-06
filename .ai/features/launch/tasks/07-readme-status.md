# Task 07: readme-status

## Objective

The README's status, live demo link and "How to play" match what shipped. It says the site is live, names only desktop Chrome as tested, promises nothing, and every link in it opens.

## Context

**Satisfies**: REQ-7, REQ-8, REQ-14

The status still says the launch is in progress, and that Edge, Firefox and Safari get checked before it ends. Nobody has tried them, and Carlo chose not to. The "New in gibber-hands" section already exists and only needs its links checked. This task follows the GIF and the Chrome check, and reports the latter's results.

## Depends on

- Task 05
- Task 06

## Expected Behavior

- The status says the site is live, lists what is built, and says "Tested on desktop Chrome." No "planned" or "in progress" label is left, and no future check is promised.
- A "Known limitations" section appears only if the Chrome check found a failure that wasn't fixed, saying what fails.
- "How to play" matches the shipped controls and keys.
- Every README link opens without a 404: lineage permalinks, live demo, docs, spec folders and file links.
- Each "New in gibber-hands" item links to its file. An item that was already in the pre-AI toolbox claims only what changed.

## Acceptance Criteria

- [ ] The status says the site is live and "Tested on desktop Chrome.", with no "planned" or "in progress" label (REQ-7, REQ-14)
- [ ] The README promises no future browser check (REQ-14)
- [ ] "How to play" matches the shipped controls and keys, and the live demo link opens the live site (REQ-7)
- [ ] Every README link opens without a 404 (REQ-8, Validation)
- [ ] Each "New in gibber-hands" item links to an existing file, and toolbox items claim only what changed (REQ-8)

## Edge Cases

- Behavior changed while tuning after launch → README updated in the same commit as the change (REQ-7)
- Live demo link → opened and checked on the live site before announcing (REQ-7)
- Status written while the launch is still open → rewritten in the change that closes the launch: it says the site is live, with no milestone in progress (REQ-7)
- Someone later tries Edge, Firefox or Safari → the README adds each browser that passed, in the same change as its PROCESS.md line (REQ-14)
- Technique already in the pre-AI toolbox (e.g. pinch) → listed as new only for what changed (scaling by hand size), with a pointer to the original (REQ-8)
- Linked file renamed later → the link check before announcing catches it (REQ-8)
- A Chrome check failed and wasn't fixed (Task 06) → listed under "Known limitations" with what fails (REQ-4)

## Notes from implementation

- **Impacts Task 07**: the README's "Known limitations" depends on Carlo's first-visit figure (Task 06) from his laptop. Every other check on the live site passed, so nothing else goes there. /dev, 2026-11-06.
