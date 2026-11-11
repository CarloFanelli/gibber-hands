# UI

The page around the camera: its bars, panels, dialogs and the labels drawn over the video.

## Terms

### Top bar
The thin bar across the top of the page, always visible. It holds Start/Stop audio, the camera and audio status, the left-handed switch and the Help button.
_Avoid_: header, toolbar (vague about what it must always hold)

### Side panel
The collapsible, resizable panel on the right with two tabs, Code and Gestures (the **Gesture guide**).
_Avoid_: code panel (it holds the guide too), sidebar

### Sounds panel
The floating panel with the six preset cards, "Now playing" and the drum controls. It is dragged by its title bar and can shrink to an icon.
_Avoid_: instrument panel (the pre-redesign column, gone), floating panel, drawer

### Welcome dialog
The dialog that opens on each visit until the visitor has made a sound for one second. Its "Start playing" button starts audio.
_Avoid_: splash, intro modal, onboarding (the **Step hint** is the in-play guide)

### Help dialog
The dialog opened by the Help button or "?" that lists every button and keyboard shortcut. It links to the **Gesture guide** instead of repeating it.
_Avoid_: help sheet (old name; "sheet" now means **Bottom sheet**), modal

### Bottom sheet
On windows below 720 px, a panel that slides up from the bottom: either the sounds panel or the side panel's content. Only one is open at a time.
_Avoid_: drawer, sheet for anything else (the help dialog is not a sheet)

### Hand tag
The small label that follows a tracked hand over the camera view, with its role, gesture and, in **Shape mode**, octave and effect amount.
_Avoid_: label (the note lane labels), badge, gesture label

## Gotchas

- **A disabled button can't take focus back**: a dialog that closes as audio starts hands focus to the audio button, which was `disabled` while starting, so focus fell to the page. Use `aria-disabled` and ignore presses in the click handler for a button that a dialog may return focus to.
- **A state class must outrank the element's own display**: a plain `display: flex` that comes later beats a state class's `display: none`, so a collapsed panel still showed. Write the state as a variant on the element (`[&.panel-hidden]:hidden`), which is more specific than the plain `flex`.
- **Two utilities for one property on one element**: their order in Tailwind's output, not in the class list, decides which wins, and the `font` shorthand sorts after `text-*` and `font-*`. Never put conflicting utilities on one element: pass a look in (as the status card does) or use a variant.
- **Tailwind scans `src/` only**: classes written in `index.html` need its `@source` line in styles.css, or they are never generated.
- **The browser's defaults sit under the utilities, not Tailwind's resets**: the base layer in styles.css sets buttons, inputs, selects and dialogs back to the browser's own look, which the page was built on. A button with no `font-[inherit]` and no `text-*` uses the browser's button font at 13.33 px. Check a style change with `npm run look -- capture` then `compare` against a recording made before it.
- **Padding utilities are logical**: `px-*`/`py-*` follow the writing mode, so on a `vertical-rl` button they swap axes. Use `pt-*`/`pl-*` there.
- **Container queries change measured sizes**: the camera view's container query hides a hand tag's words below 560 px, so a cached tag size goes stale on resize. Clear such caches in the ResizeObserver, not only when the text changes.
