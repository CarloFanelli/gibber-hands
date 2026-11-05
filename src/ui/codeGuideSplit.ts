/**
 * The divider between the live code and the gesture guide, in the code panel. It moves like the bars between
 * panels: dragged with a mouse or a finger, or 24 px per up or down arrow press once focused. The split is
 * the code's share of the panel's height, so a window resize keeps it, and the browser remembers it. Each
 * part keeps at least 120 px; a panel too short for both has no divider and splits half and half (styles.css).
 */
import { readStored, writeStored } from './storage';

/** Browser storage key of the code's share of the code panel's height, from 0 to 1. */
const SPLIT_KEY = 'gibber-hands-code-split';
/** The fewest px the code or the guide keeps while the divider moves. */
const MIN_PART_PX = 120;
/** How far one arrow key press moves the divider, in px, as for the bars between panels. */
const KEY_STEP_PX = 24;
const HALF = 0.5;

/** The code's saved share of the panel; half and half when nothing readable is saved. */
export function savedShare(stored: string | null): number {
  const share = stored === null || stored.trim() === '' ? NaN : Number(stored);
  return share >= 0 && share <= 1 ? share : HALF;
}

/** The share, moved where needed so the code and the guide each keep 120 px of a panel this tall. */
export function clampShare(share: number, panelPx: number): number {
  if (panelPx < 2 * MIN_PART_PX) return HALF;
  const min = MIN_PART_PX / panelPx;
  return Math.min(Math.max(share, min), 1 - min);
}

/** Makes `divider` share `panel` between `code`, above it, and the guide below. */
export function mountCodeGuideSplit(panel: HTMLElement, code: HTMLElement, divider: HTMLElement): void {
  divider.tabIndex = 0;
  divider.setAttribute('role', 'separator');
  divider.setAttribute('aria-orientation', 'horizontal');
  divider.setAttribute('aria-label', 'Resize code and gesture guide');

  function show(share: number) {
    panel.style.setProperty('--code-share', String(share));
    divider.setAttribute('aria-valuenow', String(Math.round(share * 100)));
  }
  /** The share as drawn: the 120 px floor can hold a part above its saved share in a shorter window. */
  const shown = () => code.getBoundingClientRect().height / panel.clientHeight;
  const save = () => writeStored(SPLIT_KEY, panel.style.getPropertyValue('--code-share'));

  let drag: { y: number; share: number } | null = null;
  divider.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    // No text selected while dragging; the capture keeps the moves coming outside the divider.
    e.preventDefault();
    divider.setPointerCapture(e.pointerId);
    drag = { y: e.clientY, share: shown() };
  });
  divider.addEventListener('pointermove', (e) => {
    if (drag) show(clampShare(drag.share + (e.clientY - drag.y) / panel.clientHeight, panel.clientHeight));
  });
  divider.addEventListener('lostpointercapture', () => {
    if (drag) save();
    drag = null;
  });
  divider.addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowUp' ? -KEY_STEP_PX : e.key === 'ArrowDown' ? KEY_STEP_PX : 0;
    if (step === 0) return;
    e.preventDefault();
    show(clampShare(shown() + step / panel.clientHeight, panel.clientHeight));
    save();
  });

  show(savedShare(readStored(SPLIT_KEY)));
}
