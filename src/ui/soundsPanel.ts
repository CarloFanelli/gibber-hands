/**
 * The sounds panel: the presets and the drums, floating over the camera stage. Its title bar drags it with
 * the mouse anywhere in the stage, never out of it; its "—" button, or the S key (ui/shortcuts), shrinks it to
 * an icon in the same corner, and the icon restores it. Where it sits and whether it is open are remembered
 * (panelPlacement). The preset cards inside keep their own drag onto "Now playing" (ui/presetList). In a
 * narrow window it is a bottom sheet instead (ui/bottomSheets): always open there, and not dragged.
 */
import { NARROW_QUERY } from './bottomSheets';
import { fractionAt, placeAt, savedPlacement, storedPlacement, type Placement } from './panelPlacement';
import { readStored, writeStored } from './storage';

/** Browser storage key of the sounds panel's place and open state. */
const SOUNDS_PANEL_KEY = 'gibber-hands-sounds-panel';

export interface SoundsPanel {
  /** Where the preset list and the drum controls go. */
  body: HTMLElement;
  /** Shrinks the panel to its icon, or restores it. */
  toggle(): void;
  /** The preset playing, named in the icon's tooltip. */
  setNowPlaying(name: string): void;
  /** Called just after the panel shrinks, so a preset card dragged inside it can let go. */
  onShrink(callback: () => void): void;
}

export function createSoundsPanel(stage: HTMLElement): SoundsPanel {
  const panel = document.createElement('section');
  // Below 720 px a bottom sheet: fixed above the bottom bar, shown while it is the open sheet, never moved.
  panel.className = [
    'sounds-panel group/sounds absolute top-0 left-0 z-2 flex max-h-[calc(100%-24px)] w-[300px] flex-col rounded-xl border border-line-strong bg-surface shadow-float',
    'min-[720px]:[&.sounds-shrunk]:w-auto min-[720px]:[&.sounds-shrunk]:rounded-[50%] min-[720px]:[&.sounds-shrunk]:border-0 min-[720px]:[&.sounds-shrunk]:bg-transparent min-[720px]:[&.sounds-shrunk]:shadow-none',
    'max-[720px]:fixed max-[720px]:inset-x-0 max-[720px]:top-auto max-[720px]:bottom-14 max-[720px]:z-3 max-[720px]:hidden max-[720px]:max-h-[70vh] max-[720px]:w-auto max-[720px]:max-w-none max-[720px]:rounded-t-xl max-[720px]:rounded-b-none max-[720px]:border-b-0 max-[720px]:shadow-sheet max-[720px]:transform-none! max-[720px]:group-data-[sheet=sounds]/app:flex'
  ].join(' ');
  panel.setAttribute('aria-label', 'Sounds');
  panel.innerHTML = `
    <div class="sounds-title flex flex-none cursor-grab items-center justify-between border-b border-line pr-1 pl-3.5 select-none active:cursor-grabbing min-[720px]:group-[.sounds-shrunk]/sounds:hidden max-[720px]:cursor-default">
      <h2 class="font-mono text-xs font-semibold tracking-[0.08em] text-muted uppercase" title="Drag the title bar to move the panel">Sounds</h2>
      <button type="button" class="sounds-shrink min-h-11 min-w-11 cursor-pointer rounded-lg border-0 bg-transparent font-[inherit] text-base text-muted hover:text-fg active:bg-bg max-[720px]:hidden" aria-label="Shrink the sounds panel" title="Shrink to an icon (S)">—</button>
    </div>
    <div class="sounds-body flex min-h-0 flex-col gap-2.5 overflow-y-auto p-3 min-[720px]:group-[.sounds-shrunk]/sounds:hidden"></div>
    <button type="button" class="sounds-icon hidden size-13 cursor-pointer rounded-[50%] border border-line-strong bg-surface text-[22px] text-accent shadow-icon hover:border-accent active:bg-bg min-[720px]:group-[.sounds-shrunk]/sounds:inline-block"><span aria-hidden="true">♫</span></button>
  `;
  stage.append(panel);
  const title = panel.querySelector<HTMLElement>('.sounds-title')!;
  const shrink = panel.querySelector<HTMLButtonElement>('.sounds-shrink')!;
  const icon = panel.querySelector<HTMLButtonElement>('.sounds-icon')!;
  const body = panel.querySelector<HTMLElement>('.sounds-body')!;

  let placement: Placement = savedPlacement(readStored(SOUNDS_PANEL_KEY));
  let shrunk: () => void = () => {};
  const save = () => writeStored(SOUNDS_PANEL_KEY, storedPlacement(placement));
  const size = (el: HTMLElement) => ({ width: el.offsetWidth, height: el.offsetHeight });

  function place() {
    const at = placeAt(placement, size(stage), size(panel));
    panel.style.transform = `translate(${at.left}px, ${at.top}px)`;
  }
  function show(open: boolean) {
    // Shrinking from a control inside the panel would drop focus to the page: it goes to the icon.
    const refocus = !open && panel.contains(document.activeElement);
    placement = { ...placement, open };
    // The class hides the title and the body or the icon: a bottom sheet shows them all the same.
    panel.classList.toggle('sounds-shrunk', !open);
    place();
    save();
    if (refocus) icon.focus();
    if (!open) shrunk();
  }

  // Mouse only, like the other drags on the page: on a touch screen the panel stays where it is.
  let drag: { x: number; y: number; left: number; top: number } | null = null;
  title.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target === shrink || matchMedia(NARROW_QUERY).matches) return;
    // No text selected while dragging; the capture keeps the moves coming outside the title bar.
    e.preventDefault();
    title.setPointerCapture(e.pointerId);
    const at = placeAt(placement, size(stage), size(panel));
    drag = { x: e.clientX, y: e.clientY, ...at };
  });
  title.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const at = { left: drag.left + e.clientX - drag.x, top: drag.top + e.clientY - drag.y };
    placement = { ...placement, ...fractionAt(at, size(stage), size(panel)) };
    place();
  });
  title.addEventListener('lostpointercapture', () => {
    if (drag) save();
    drag = null;
  });

  shrink.addEventListener('click', () => show(false));
  icon.addEventListener('click', () => {
    show(true);
    shrink.focus();
  });
  // A resized window or side panel moves the stage's edges, and the panel's own size can change: it keeps
  // its corner, inside them.
  const resized = new ResizeObserver(place);
  resized.observe(stage);
  resized.observe(panel);
  show(placement.open);

  return {
    body,
    toggle: () => show(!placement.open),
    setNowPlaying(name) {
      icon.title = `Open the sounds panel (S) · Now playing: ${name}`;
      icon.setAttribute('aria-label', `Open the sounds panel. Now playing: ${name}`);
    },
    onShrink(callback) {
      shrunk = callback;
    }
  };
}
