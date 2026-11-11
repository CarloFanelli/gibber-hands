/**
 * The six presets in the sounds panel, as cards showing each one's number key, name, character and
 * scale, under a "Now playing" slot showing the selected one. Clicking a card, or dragging it onto the
 * slot with the mouse (drag-kit), picks it; picking only reports it, and the selection is shown once
 * show() is called. Touch screens don't drag: a tap picks.
 */
import DragAndDrop from '../vendor/drag-kit/dragedrop.js';
import { PRESETS } from '../synth/presets';

export interface PresetList {
  /** Marks preset `index` (a PRESETS index) as the selected one. */
  show(index: number): void;
  /** Lets go of a card being dragged, with no preset picked: the slot it would drop on is hidden by now. */
  cancelDrag(): void;
}

/** A press that moves farther than this, in px, is a drag: releasing the card then doesn't click it. */
const DRAG_THRESHOLD_PX = 4;
/** The class of a card being dragged. */
const DRAGGING = 'preset-dragging';

export function createPresetList(root: HTMLElement, onPick: (index: number) => void): PresetList {
  const nowPlaying = document.createElement('div');
  nowPlaying.className =
    'grid rounded-lg border border-dashed border-line-strong px-2.5 py-2 [&.drop-ready]:border-accent [&.drop-over]:border-solid [&.drop-over]:border-accent [&.drop-over]:bg-accent/12';
  // Read out when it changes.
  nowPlaying.setAttribute('role', 'status');
  const playingName = text('font-semibold', '');
  const playingScale = text('text-sm text-muted', '');
  nowPlaying.append(text('text-xs tracking-[0.06em] text-muted uppercase', 'Now playing'), playingName, playingScale);

  const list = document.createElement('div');
  list.setAttribute('role', 'group');
  list.setAttribute('aria-label', 'Presets');
  // The dragged card stays under the pointer, so releasing it anywhere clicks it: remember whether the
  // press moved.
  let press: { x: number; y: number; moved: boolean } | null = null;
  // drag-kit leaves a faded copy of a dragged card after it, in the card's parent: each card has its own.
  const cells = PRESETS.map(() => {
    const cell = document.createElement('div');
    // The cards are in block flow, not a grid: a grid would start a dragged card from its corner, not its place.
    cell.className = 'not-first:pt-1.5';
    return cell;
  });
  const buttons = PRESETS.map((preset, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    // Character and scale share the second line, the scale on the right; a long character gives way to it.
    button.className =
      'preset group/card grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-2.5 rounded-lg border border-line-strong bg-transparent px-2.5 py-1.5 text-left font-[inherit] text-base text-fg select-none hover:border-line-hover active:brightness-90 aria-pressed:border-accent aria-pressed:bg-accent/12 [&.preset-dragging]:z-1 [&.preset-dragging]:bg-surface! [&.preset-dragging]:shadow-lift';
    button.title = `${preset.name}: ${preset.character}, ${preset.scale}. Press ${i + 1}, or drag onto Now playing`;
    button.append(
      text('row-span-2 font-mono text-muted group-aria-pressed/card:text-accent', String(i + 1)),
      text('col-[2/4] font-semibold', preset.name),
      text('overflow-hidden text-sm text-ellipsis whitespace-nowrap text-muted', preset.character),
      text('text-sm whitespace-nowrap text-muted', preset.scale)
    );
    // A keyboard click (detail 0) always picks; a mouse click only if the press didn't drag the card.
    button.addEventListener('click', (e) => {
      if (e.detail === 0 || !press?.moved) onPick(i);
    });
    cells[i]!.append(button);
    return button;
  });
  list.append(...cells);
  root.append(nowPlaying, list);

  list.addEventListener('mousedown', (e) => {
    press = { x: e.clientX, y: e.clientY, moved: false };
  });
  document.addEventListener('mousemove', (e) => {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > DRAG_THRESHOLD_PX) press.moved = true;
  });

  new DragAndDrop({
    dragElements: {
      elementSelector: buttons,
      // Over the slot, drag-kit swaps a card's drag classes for its hover classes: the same class, so the card
      // looks the same. It adds them again after a drop there, so the drop takes it off.
      elementOnDragClassList: [DRAGGING],
      elementHoverClassList: [DRAGGING],
      placeholderOpacity: 30
    },
    dropZones: {
      elementSelector: [nowPlaying],
      elementDragClassList: ['drop-ready'],
      elementHoverClassList: ['drop-over']
    },
    callback: (card) => {
      card.classList.remove(DRAGGING);
      onPick(buttons.indexOf(card as HTMLButtonElement));
    }
  });

  return {
    show(index) {
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      playingName.textContent = PRESETS[index]!.name;
      playingScale.textContent = PRESETS[index]!.scale;
    },
    cancelDrag() {
      // drag-kit ends a drag on a move with no button held, dropping where the pointer is: on no slot.
      if (document.onmousemove && buttons.some((b) => b.classList.contains(DRAGGING))) {
        document.onmousemove(new MouseEvent('mousemove', { buttons: 0 }));
      }
    }
  };
}

function text(className: string, content: string) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = content;
  return span;
}
