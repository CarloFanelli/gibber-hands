# Task 07: drum-guidance

## Objective

The gesture guide and the help sheet describe the rock sign, drum mode and the D key, naming the second hand by its side.

## Context

**Satisfies**: REQ-18

Last, once every drum gesture works, so the guide and the help sheet describe what exists. Both already name each hand by its role and side and follow the lead-hand swap; drum mode joins their rows.

## Depends on

- Task 01
- Task 02
- Task 03
- Task 04

## Expected Behavior

- The gesture guide lists the second hand's rock sign 🤟, which switches it between playing notes and drum mode, and what drum mode does: left or right picks the drum pattern, up or down sets the drum layers, a closed fist mutes the drums.
- The help sheet lists the same gestures, the D key, and the "Start drums" / "Stop drums" button.
- Both name the second hand by its side, following the lead-hand swap.

## Acceptance Criteria

- [ ] The gesture guide lists the rock sign and what drum mode's left–right, height and closed fist do (REQ-18)
- [ ] The help sheet lists the same gestures, the D key and the "Start drums" button (REQ-18)
- [ ] Both name the second hand by its side, and change at once when the roles swap (REQ-18)

## Edge Cases

- Roles swapped → the guide and the help sheet name the right hand as the one showing the rock sign (REQ-18)
- N/A — empty and concurrent: the guide and help sheet are fixed text (REQ-18)
