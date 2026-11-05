# Task 04: gesture-guide

## Objective

Below the live code, in the same panel, a gesture guide lists every gesture and what it does, naming each hand by its role and side. "Hide code" now hides only the code, and the guide stays in view.

## Context

**Satisfies**: REQ-11, REQ-12, REQ-15, REQ-16

Players who don't read code get the gestures always in view. The guide comes after the extra lanes and the thumbs-down because it describes both. Here code and guide share the panel half and half; Task 05 makes the split movable. The help sheet gains the thumbs-down and the wider picture's lanes.

## Depends on

- Task 01
- Task 02

## Expected Behavior

- The code panel shows the live code on top and the gesture guide below it, half and half, each scrolling on its own.
- The guide lists the eight gestures of the spec's table, each with what it does.
- It names each hand by its role and side, for example "Left hand, the second hand", and the names change at once when the roles swap.
- Without a camera, the guide's first line says the sliders stand in for the hand.
- "Hide code" and the C key hide only the code: the guide fills the panel, the panel keeps its width and the bars beside it still resize it. "Show code" brings the code back.
- The help sheet describes the thumbs-down, naming the second hand's side, the extra lanes of a wider camera picture, and that "Hide code" and C hide the code only.

## Acceptance Criteria

- [ ] Below the live code, the gesture guide lists all eight gestures of the spec's table and what each does (REQ-11)
- [ ] Without a camera, the guide's first line says the sliders stand in for the hand (REQ-11)
- [ ] The guide names each hand by role and side, and the names change at once when the roles swap (REQ-12)
- [ ] "Hide code" and the C key hide only the code; the guide fills the panel, which keeps its width (REQ-15)
- [ ] Hiding the code while its Copy button has focus moves focus to "Show code" (REQ-15)
- [ ] The help sheet describes the thumbs-down, naming the second hand's side, and the wider picture's extra lanes (REQ-16)

## Edge Cases

- No camera (sliders) → the guide stays, with a first line saying the sliders stand in for the hand without a camera (REQ-11)
- Guide taller than its part of the panel → the guide scrolls on its own; the code stays in place (REQ-11)
- Network and integrity → N/A: the guide is fixed text in the page (REQ-11)
- Roles swapped → the guide names the left hand as the lead hand and the right hand as the second hand (REQ-12)
- Roles swapped while the guide is in view → the names change at once (REQ-12)
- Code hidden → the guide fills the panel; the panel keeps its width, and the bars beside it still resize it (REQ-15)
- Code hidden while its Copy button has focus → focus moves to the "Show code" button, as today (REQ-15)
- Page reloaded with the code hidden → the code shows again, as today (REQ-15)
- Roles swapped → the help sheet names the right hand as the one showing the thumbs-down (REQ-16)
- Empty and concurrent → N/A: the help sheet is fixed text (REQ-16)
