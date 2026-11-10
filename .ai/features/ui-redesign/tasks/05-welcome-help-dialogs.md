# Task 05: welcome-help-dialogs

## Objective

A welcome dialog lets new visitors start audio in one click. The help dialog lists every button and key, and its link opens the gesture guide. Both dialogs keep keyboard focus inside while open.

## Context

**Satisfies**: REQ-18, REQ-19, REQ-20, REQ-21, REQ-22, REQ-23, REQ-32

It comes after the top bar (Start audio, Help button) and the side panel (the Gestures tab its link opens) exist. The welcome dialog follows the same first-sound rule that retires the step hints.

## Depends on

- Task 01
- Task 02
- Task 03

## Expected Behavior

- Each visit opens the welcome dialog, which says in one sentence what the page does, until the visitor has made a sound for one second.
- "Start playing" starts audio and closes the dialog with one click.
- The close button, Escape or a click outside closes it without starting audio, and the step hints guide as before.
- The Help button or "?" opens the help dialog, which lists every button and keyboard shortcut: 1–6, Space, D, C, S, F, "?", Escape. Escape, "?" or its close button closes it.
- The help dialog's gesture descriptions are replaced by a "Show gestures" link, which closes it and opens the side panel on the Gestures tab.
- While a dialog is open, focus stays inside it, and only Escape and "?" act as shortcuts. Closing it returns focus to the control that opened it.

## Acceptance Criteria

- [ ] The welcome dialog opens on every visit until a sound has lasted one second, then never again (REQ-18)
- [ ] "Start playing" starts audio and closes the dialog with one click (REQ-19)
- [ ] Close, Escape or a click outside closes it without audio; the "start audio" step hint then shows (REQ-20)
- [ ] Help button and "?" open the help dialog listing every control and shortcut; Escape, "?" and Close close it (REQ-21, REQ-32)
- [ ] "Show gestures" closes help and shows the Gestures tab in an expanded side panel (REQ-22)
- [ ] With a dialog open, Tab never leaves it and other shortcuts do nothing; closing returns focus to its opener (REQ-23)

## Edge Cases

- Visitor already made a sound on an earlier visit → no welcome dialog and no step hints (REQ-18)
- Visitor makes a sound for 1 s while the dialog is closed → the flag is set, and the dialog never shows again (REQ-18)
- Camera permission prompt and welcome dialog at the same time → both show; "Start playing" works whatever the camera answer is (REQ-19)
- "Start playing" double-clicked → audio starts once, and the second click does nothing (REQ-19)
- Audio fails to start from "Start playing" → the welcome dialog closes and the top bar shows the failure with Try again (REQ-19)
- Welcome closed without playing → the "start audio" step hint points at the top-bar button (REQ-20)
- "?" pressed while the welcome dialog is open → the welcome closes and help opens; only one dialog at a time (REQ-21, REQ-23)
- Shortcuts while a dialog is open → only Escape and "?" act; other keys do nothing (REQ-23, REQ-32)
- "Show gestures" while the side panel is collapsed → the side panel expands on the Gestures tab (REQ-22)
- Opener no longer visible when a dialog closes → focus goes to Start audio (REQ-23)
