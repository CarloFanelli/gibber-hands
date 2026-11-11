# Backlog

### B-1 · picked-up
- **What**: Play with two hands, e.g. one picks the notes and the other shapes the sound.
- **From**: hand-tracking (interview, 2026-11-02)
- **Picked up by**: two-hand-play (2026-11-04)

### B-2 · open
- **What**: A gesture that freezes the current note so the player can sweep the brightness over it.
- **From**: hand-to-sound (interview, 2026-11-02)

### B-3 · picked-up
- **What**: Control the reverb or echo amount with the hand, after play-testing.
- **From**: hand-to-sound (interview, 2026-11-02)
- **Picked up by**: two-hand-play (2026-11-04)

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

### B-9 · picked-up
- **What**: A visible Help button that opens the help sheet. Today only the "?" key opens it, so phone users and people using only a mouse can't open it.
- **From**: instrument-ui (dev task 05, 2026-11-03)
- **Picked up by**: ui-redesign (2026-11-10)

### B-10 · open
- **What**: At phone width, the "Video stays on your device" note in the corner of the camera panel covers the bottom of the sliders that replace the camera.
- **From**: instrument-ui (dev task 02, 2026-11-03)

### B-11 · picked-up
- **What**: When the panels are stacked (narrow window or phone), the "Hide code" button sits at the bottom of the instrument panel, below the six preset cards, so it is out of sight until that panel is scrolled.
- **From**: instrument-ui (dev task 05, 2026-11-03)
- **Picked up by**: ui-redesign (2026-11-10)

### B-12 · picked-up
- **What**: At phone width the camera panel is short, so the step hint at its top (for example "Start audio") sits over the camera's status card, such as "No camera found", and hides its Try again button. The button still works under it, but it can't be seen.
- **From**: instrument-ui (dev task 06, 2026-11-03)
- **Picked up by**: launch (2026-11-06)

### B-13 · picked-up
- **What**: A way to play every note an octave lower, e.g. a second gesture of the shaping hand.
- **From**: two-hand-play (interview, 2026-11-04)
- **Picked up by**: note-range (2026-11-05)

### B-14 · open
- **What**: Let each hand play its own preset, e.g. Deep Bass on the left and Saw Lead on the right.
- **From**: two-hand-play (interview, 2026-11-04)

### B-15 · picked-up
- **What**: A rhythm milestone: a drum loop at a set tempo that you start, change and shape with your hands.
- **From**: two-hand-play (interview, 2026-11-04)
- **Picked up by**: drum-loop (2026-11-05)

### B-16 · picked-up
- **What**: Add a favicon. Today the browser asks for one on every visit, gets "not found", and shows a red error in the console; visitors see nothing.
- **From**: launch (dev task 06, 2026-11-06)
- **Picked up by**: ui-redesign (2026-11-10)

### B-17 · open
- **What**: On touch screens at least 720 px wide (tablets), drag the sounds panel and resize the side panel with a finger; this needs touch support in Resizer and drag-kit.
- **From**: ui-redesign (interview, 2026-11-10)

### B-18 · open
- **What**: A "Reset layout" control that puts the side panel and the sounds panel back where a first visit places them, without clearing site data.
- **From**: ui-redesign (interview, 2026-11-10)

### B-19 · open
- **What**: Without a camera, in a 1280×800 window, the sounds panel's first position covers the left edge of the sliders ("Palm center" reads "alm center"); its first position should avoid them.
- **From**: tailwind-styles (interview, 2026-11-11)
