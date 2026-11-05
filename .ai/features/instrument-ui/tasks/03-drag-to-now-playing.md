# Task 03: drag-to-now-playing

## Objective

With the mouse, a visitor can drag a preset card onto the "Now playing" slot to select it.

## Context

**Satisfies**: REQ-6

Clicking already selects a preset (task 02); dragging adds the gesture the author's drag-kit was built for. Its 2024 file is copied in, with a header that links the original commit and lists every fix. drag-kit handles the mouse only, so touch screens keep selecting by tapping.

## Depends on

- Task 02

## Expected Behavior

- The instrument panel has a "Now playing" slot showing the current preset.
- Dragging a preset card with the mouse and dropping it on "Now playing" selects that preset, exactly as clicking it does.
- A card dropped anywhere else returns to its place, and nothing changes.
- On touch screens dragging is unavailable; tapping a preset selects it.
- The copied drag-kit file differs from its 2024 commit only by the fixes listed in its header.

## Acceptance Criteria

- [ ] A "Now playing" slot in the instrument panel shows the current preset (REQ-6)
- [ ] Dropping a preset card on "Now playing" selects it, as clicking it does (REQ-6)
- [ ] A card released outside "Now playing" returns to its place and changes nothing (REQ-6)
- [ ] The copied drag-kit file differs from its 2024 commit only by the fixes its header lists (REQ-6)

## Edge Cases

- Drag released outside "Now playing" → no change; the card returns to its place (REQ-6)
- Touch screen → dragging unavailable; tapping a preset selects it (REQ-6)

## Notes from implementation

- **Known limitation**: only Chromium was tested, scripted in headless mode: real mouse events for a drop on "Now playing", a drop elsewhere, a release outside the window (delivered or lost), plain and wobbly clicks, a press that drags and comes back, Enter on a focused card, a panel resize after a drag, and emulated touch for a tap and a touch drag. Firefox, Safari and a real touch screen are manual checks. /dev, 2026-11-03.
- **Known limitation**: when a release outside the window never reaches the page, the drag ends on the first move the page sees with no button held, as a release at that spot. If that first spot is "Now playing", the card counts as dropped there. Browsers normally deliver the release even outside the window, so this needs a lost release and a return straight onto the slot. /dev, 2026-11-03.
