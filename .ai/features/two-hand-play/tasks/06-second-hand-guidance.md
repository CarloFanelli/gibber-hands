# Task 06: second-hand-guidance

## Objective

Once the first sound has lasted a second, one more step hint teaches the Victory switch until the second hand first switches. The help sheet explains both hands' roles, the switch and shape mode.

## Context

**Satisfies**: REQ-18, REQ-19, REQ-20

Last, because it teaches what Tasks 03 and 04 built, and names the hands by the roles from Task 01.

## Depends on

- Task 03
- Task 04

## Expected Behavior

- After the first sound has lasted a second, a step hint shows a Victory-sign icon and "Left hand: shape sound".
- That step hint goes once the second hand first switches to shape mode, and never returns in that browser.
- The help sheet describes both hands' roles, the Victory switch, and shape mode's squeeze and height.
- The step hint and the help sheet name the hands by the current roles.

## Acceptance Criteria

- [ ] After a second of sound, a step hint shows a Victory-sign icon and "Left hand: shape sound" (REQ-18)
- [ ] The second hand's first switch to shape mode removes that step hint for good in that browser (REQ-19)
- [ ] The help sheet describes both hands' roles, the Victory switch, and shape mode's squeeze and height (REQ-20)
- [ ] With the roles swapped, the step hint and the help sheet name the hands the other way round (REQ-18, REQ-20)

## Edge Cases

- Roles swapped → the step hint reads "Right hand: shape sound" (REQ-18)
- No camera (sliders) → the second-hand step hint never shows (REQ-18)
- Step hint ignored → it hides after 10 s and returns on the next visit, until the second hand first switches (REQ-19)
- Browser storage blocked → the step hint returns every visit until the second hand switches in that visit (REQ-19)
- Roles swapped → the help sheet names the left hand as the lead hand (REQ-20)
- Empty and concurrent states → N/A: the help sheet is fixed text (REQ-20)
