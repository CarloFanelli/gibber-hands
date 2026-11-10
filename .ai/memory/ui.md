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
