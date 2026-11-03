# Task 05: keyboard-and-help

## Objective

Keys 1–6 pick presets, Space starts or stops audio, C hides or shows the code panel, and "?" opens a help sheet listing the controls and shortcuts.

## Context

**Satisfies**: REQ-3, REQ-6, REQ-16, REQ-17

The shortcuts drive controls the earlier tasks built: the presets, the audio button and the code panel button. The help sheet lists every control, so it comes after them. The spec also asks that every control works with the keyboard alone, with a visible focus outline.

## Depends on

- Task 01
- Task 02
- Task 03

## Expected Behavior

- Keys 1–6 select the matching preset, Space starts or stops audio, and C hides or shows the live code panel.
- "?" opens a help sheet listing the controls and shortcuts; Escape or "?" closes it.
- Every control works with the keyboard alone and shows a visible focus outline.
- Text contrast meets WCAG 2.2 AA (at least 4.5:1).

## Acceptance Criteria

- [ ] Keys 1–6 select presets, Space starts or stops audio, and C hides or shows the code panel (REQ-17, REQ-6, REQ-3)
- [ ] "?" opens a help sheet listing every control and shortcut; Escape or "?" closes it (REQ-16)
- [ ] Every control works with the keyboard alone and shows a visible focus outline (REQ-17)

## Edge Cases

- Number key for the preset already selected → nothing changes (REQ-6)
- Keys 1, 2, 3 pressed within 60 ms → ends on preset 3; never two sounds at once (REQ-7)
- Escape with the help sheet closed → nothing happens (REQ-16)
- "?" pressed twice quickly → opens, then closes (REQ-16)
- Space pressed while a button has focus → the focused button acts; the shortcut doesn't also fire (REQ-17)
- Key held down (auto-repeat) → acts once per press (REQ-17)
- Keyboard layout where "?" needs Shift → works with Shift (REQ-17)

## Notes from implementation

- **Impacts Task 05**: from task 01, the layout does not return a code-panel toggle yet, because nothing outside it called one. The button's handler in `src/ui/layout.ts` (`showCodePanel`) hides or shows the panel and keeps the button's text and `aria-expanded` in step; return a toggle built on it for the C key, so the key and the button stay in agreement.
