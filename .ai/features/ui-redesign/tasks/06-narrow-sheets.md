# Task 06: narrow-sheets

## Objective

On phones and windows below 720 px wide, the camera fills the screen under the top bar. A bottom bar opens the sounds panel or the code and gestures as bottom sheets, one at a time.

## Context

**Satisfies**: REQ-27, REQ-28, REQ-29

This replaces the old stacked columns for narrow windows. It needs the side panel, the sounds panel and the help dialog's "Show gestures" link in place, since the sheets show the same content. It also settles the backlog item about the "Hide code" button out of sight on phones.

## Depends on

- Task 01
- Task 03
- Task 05

## Expected Behavior

- Below 720 px, the stage fills the space under the top bar, and a bottom bar offers "Sounds" and "Code & gestures".
- Each button opens its panel as a bottom sheet. Only one sheet is open at a time, and its × or a tap on the stage closes it.
- Below 720 px, panels neither move nor resize, and presets are selected by tapping their card.
- The help dialog's "Show gestures" opens the "Code & gestures" sheet on the Gestures tab.

## Acceptance Criteria

- [ ] At 719 px and below: top bar, full stage, and a bottom bar with the two buttons (REQ-27)
- [ ] Each button opens its bottom sheet; opening one closes the other (REQ-28)
- [ ] The sheet's × and a tap on the stage close it (REQ-28)
- [ ] Below 720 px nothing drags or resizes, and tapping a card selects its preset (REQ-29)

## Edge Cases

- Window exactly 720 px wide → the desktop layout; sheets start at 719 px (REQ-27)
- Rotating a phone across 720 px → the layout switches, and an open sheet closes (REQ-27, REQ-28)
- One sheet open when the other button is tapped → the first closes and the second opens (REQ-28)
- "Show gestures" below 720 px → the "Code & gestures" sheet opens on the Gestures tab (REQ-22, REQ-28)
