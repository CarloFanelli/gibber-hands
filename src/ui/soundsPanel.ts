/**
 * The sounds panel: the presets and the drums, floating over the camera stage. Its title bar drags it with
 * the mouse anywhere in the stage, never out of it; its "—" button, or the S key (ui/shortcuts), shrinks it to
 * an icon in the same corner, and the icon restores it. Where it sits and whether it is open are remembered
 * (panelPlacement). The preset cards inside keep their own drag onto "Now playing" (ui/presetList).
 */
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
  panel.className = 'sounds-panel';
  panel.setAttribute('aria-label', 'Sounds');
  panel.innerHTML = `
    <div class="sounds-title">
      <h2 class="sounds-name">Sounds</h2>
      <button type="button" class="sounds-shrink" aria-label="Shrink the sounds panel">—</button>
    </div>
    <div class="sounds-body"></div>
    <button type="button" class="sounds-icon"><span aria-hidden="true">♫</span></button>
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
    panel.classList.toggle('sounds-shrunk', !open);
    title.hidden = body.hidden = !open;
    icon.hidden = open;
    place();
    save();
    if (refocus) icon.focus();
    if (!open) shrunk();
  }

  // Mouse only, like the other drags on the page: on a touch screen the panel stays where it is.
  let drag: { x: number; y: number; left: number; top: number } | null = null;
  title.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target === shrink) return;
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
      icon.title = `Sounds · Now playing: ${name}`;
      icon.setAttribute('aria-label', `Open the sounds panel. Now playing: ${name}`);
    },
    onShrink(callback) {
      shrunk = callback;
    }
  };
}
