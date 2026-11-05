# Task 05: code-guide-divider

## Objective

The player sets how the live code and the gesture guide share their panel by dragging the divider between them, or moving it with the arrow keys; the split is remembered between visits.

## Context

**Satisfies**: REQ-13, REQ-14, REQ-15, REQ-16

The divider looks and works like the bars between panels: drag, arrow keys, size remembered. It comes last because it divides what Task 04 builds. It also brings the split back after "Show code" and adds its arrow keys to the help sheet.

## Depends on

- Task 04

## Expected Behavior

- A divider sits between code and guide; dragging it moves the split, and once focused the up and down arrow keys move it 24 px per press.
- It stops where the code or the guide reaches 120 px.
- Screen readers announce it as a separator between code and guide, with its position.
- The split is kept as a share of the panel's height: the window resizing keeps it, and a reload brings back the saved one. A first visit, blocked browser storage or an unreadable saved split gets half and half.
- A panel shorter than 240 px has no divider: code and guide each take half and scroll on their own.
- With the code hidden the divider hides; "Show code" brings the split back where it was.
- The help sheet lists the up and down arrow keys for the divider.

## Acceptance Criteria

- [ ] Dragging the divider moves the split, and it stops where the code or the guide reaches 120 px (REQ-13)
- [ ] Tab reaches the divider with a focus outline; each up or down arrow press moves it 24 px (REQ-13)
- [ ] A screen reader announces a separator between code and guide, with its position (REQ-13)
- [ ] A reload brings back the saved split; a first visit or an unreadable saved split gets half and half (REQ-14)
- [ ] Resizing the window keeps the code's and the guide's share of the panel's height (REQ-14)
- [ ] With the code hidden the divider hides; "Show code" brings the split back where it was (REQ-15)
- [ ] The help sheet lists the up and down arrow keys for the divider between code and guide (REQ-16)

## Edge Cases

- Divider dragged to the top or bottom → it stops where the code or the guide reaches 120 px (REQ-13)
- Panel shorter than 240 px (stacked panels on a phone) → no divider; code and guide each take half and scroll on their own (REQ-13)
- Keyboard only → Tab reaches the divider, with a focus outline; each arrow press moves it 24 px, as the bars between panels do (REQ-13)
- Screen reader → the divider is announced as a separator between code and guide, with its position (REQ-13)
- Window resized → code and guide keep their share of the panel's height (REQ-14)
- Page reloaded → the saved split comes back (REQ-14)
- Browser storage blocked, or the saved split unreadable → half and half; dragging still works, for that visit (REQ-14)
- Code hidden → the guide fills the panel and the divider hides (REQ-15)
- Code shown again → the split returns where it was (REQ-15)

## Notes from implementation

- **Known limitation**: AC 3 is checked from what the page tells assistive tools, not with a screen reader: in headless Chromium the divider is a horizontal separator named "Resize code and gesture guide", with the code's share from 0 to 100 as its position, updated on every move. A finger drag was checked with emulated touch, not on a phone. /dev, 2026-11-05.
