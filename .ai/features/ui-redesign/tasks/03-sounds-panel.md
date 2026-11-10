# Task 03: sounds-panel

## Objective

The presets and drums float in a sounds panel that the player can drag by its title bar anywhere over the stage, shrink to an icon and restore, with its place remembered between visits.

## Context

**Satisfies**: REQ-13, REQ-14, REQ-15, REQ-16, REQ-17, REQ-32

After Task 02, the instrument column holds only the presets and the drums. This task removes that column, so the stage spans everything left of the side panel. Preset picking keeps all three ways, drag-kit's card drag included.

## Depends on

- Task 02

## Expected Behavior

- The instrument column is gone. The sounds panel floats over the stage with the six preset cards, "Now playing" and the drum controls.
- Dragging the title bar moves the panel anywhere below the top bar, always fully inside the window, never over the side panel.
- A title-bar button and the S key shrink it to an icon in the same place. Clicking the icon or pressing S restores it.
- A first visit opens it in the stage's bottom-left corner. Later visits restore its position and its open or icon state.
- Clicking a card, pressing its number key, or dragging the card onto "Now playing" selects the preset. A card drag never moves the panel.

## Acceptance Criteria

- [ ] The sounds panel holds the six cards, "Now playing" and the drum controls, floating over the stage (REQ-13)
- [ ] Dragging the title bar moves it; it never leaves the window nor covers the side panel or top bar (REQ-14)
- [ ] The title-bar button and S shrink it to an icon and restore it (REQ-15, REQ-32)
- [ ] First visit: open, bottom-left of the stage; a reload restores position and open or icon state (REQ-16)
- [ ] Click, number key and drag onto "Now playing" each select a preset; a card drag leaves the panel in place (REQ-17)

## Edge Cases

- Window shrinks and leaves the sounds panel partly off-screen → the panel slides back fully inside the window (REQ-14)
- Sounds panel dragged over the side panel → it stops at the side panel's edge (REQ-14)
- Touch-only screen ≥ 720 px (tablet) → the sounds panel stays put but still shrinks to an icon (REQ-14)
- S pressed while a preset card is mid-drag → the drag is cancelled, then the panel shrinks (REQ-15, REQ-17)
- Sounds panel shrunk to an icon → number keys still select presets, and "Now playing" stays readable in the icon's tooltip (REQ-15, REQ-17)
- Saved position off-screen on a smaller window → the panel is placed at the nearest in-window spot (REQ-16)
- Saved layout unreadable or missing → first-visit layout, with no error shown (REQ-16)
- Preset card dropped outside "Now playing" → nothing changes, and the card returns to the list (REQ-17)
- Number key pressed before audio starts → the preset is selected and plays once audio starts, as today (REQ-17)
