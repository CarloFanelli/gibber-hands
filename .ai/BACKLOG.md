# Backlog

### B-1 · open
- **What**: Play with two hands, e.g. one picks the notes and the other shapes the sound.
- **From**: hand-tracking (interview, 2026-11-02)

### B-2 · open
- **What**: A gesture that freezes the current note so the player can sweep the brightness over it.
- **From**: hand-to-sound (interview, 2026-11-02)

### B-3 · open
- **What**: Control the reverb or echo amount with the hand, after play-testing.
- **From**: hand-to-sound (interview, 2026-11-02)

### B-4 · open
- **What**: Edit the Gibber snippet in the page and hear the change.
- **From**: hand-to-sound (interview, 2026-11-02)

### B-5 · open
- **What**: Pick a preset with the hand: hover it with the palm and squeeze to grab it, using drag-kit's geometric hit-testing.
- **From**: instrument-ui (interview, 2026-11-02)

### B-6 · open
- **What**: When the browser only has software-emulated graphics (no real graphics card, e.g. in a virtual machine), run hand tracking on the processor: measured on the i5-1240P under headless Chromium, about 50 ms per frame against 450 ms.
- **From**: hand-tracking (dev task 03, 2026-11-02)

### B-7 · open
- **What**: If the middle pinch varies by more than 15% between 40 cm and 80 cm with a real hand, measure hand size from several palm segments instead of one, so small, distant hands give steadier values.
- **From**: hand-tracking (dev task 04, 2026-11-02)

### B-8 · open
- **What**: Cut the memory that starting the audio adds to the tab, about 460 MB measured in headless Chromium. Gibber reserves a fixed 20-minute sound buffer on the page and in its audio worklet, and its start function can't make it smaller. A fix means patching or vendoring that part of Gibber's bundle.
- **From**: hand-to-sound (dev task 01, 2026-11-02)

### B-9 · open
- **What**: A visible Help button that opens the help sheet. Today only the "?" key opens it, so phone users and people using only a mouse can't open it.
- **From**: instrument-ui (dev task 05, 2026-11-03)

### B-10 · open
- **What**: At phone width, the "Video stays on your device" note in the corner of the camera panel covers the bottom of the sliders that replace the camera.
- **From**: instrument-ui (dev task 02, 2026-11-03)

### B-11 · open
- **What**: When the panels are stacked (narrow window or phone), the "Hide code" button sits at the bottom of the instrument panel, below the six preset cards, so it is out of sight until that panel is scrolled.
- **From**: instrument-ui (dev task 05, 2026-11-03)

### B-12 · open
- **What**: At phone width the camera panel is short, so the step hint at its top (for example "Start audio") sits over the camera's status card, such as "No camera found", and hides its Try again button. The button still works under it, but it can't be seen.
- **From**: instrument-ui (dev task 06, 2026-11-03)
