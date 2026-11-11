/**
 * The top bar (topBar), then two resizable panels side by side: the camera stage, with the sounds panel
 * floating over it (soundsPanel), and the side panel, which holds the live code and the gesture guide as tabs
 * (sidePanel). Resizer adds the drag handle and remembers the sizes; the side panel stays between 280 px and
 * half the row. Collapsed, it leaves the row and a narrow strip takes its place. In a narrow
 * window both panels are bottom sheets instead (bottomSheets).
 */
import Resize from '../vendor/resizer/Resize';
import { createBottomSheets } from './bottomSheets';
import { createSidePanel } from './sidePanel';
import { createSoundsPanel, type SoundsPanel } from './soundsPanel';
import { createTopBar, type TopBar } from './topBar';

/** The class Resizer leaves out of the row. */
const HIDDEN_PANEL = 'panel-hidden';

/**
 * The side panel: its tab bar on top, then the selected tab at the full height left. 360 px wide on a first
 * visit, then the width Resizer saved, between 280 px and half the row (widths are the flex basis, so Resizer's
 * apply). Below 720 px a bottom sheet over the camera, shown while it is the open sheet, collapsed or not.
 */
const SIDE_PANEL = [
  'relative flex w-[360px] max-w-1/2 min-w-[280px] flex-[0_1_auto] flex-col overflow-hidden bg-surface [&.panel-hidden]:hidden',
  'max-[720px]:fixed max-[720px]:inset-x-0 max-[720px]:bottom-14 max-[720px]:z-3 max-[720px]:hidden max-[720px]:max-h-[70vh] max-[720px]:w-auto! max-[720px]:max-w-none max-[720px]:rounded-t-xl max-[720px]:border max-[720px]:border-b-0 max-[720px]:border-line-strong max-[720px]:shadow-sheet max-[720px]:transform-none! max-[720px]:group-data-[sheet=side]/app:flex!'
].join(' ');

/** The bar between the panels: no room taken in the row (negative margins), so the widths add up to 100%; none
 * beside a collapsed side panel, nor in a narrow window. */
const RESIZE_HANDLE =
  'resize-handle relative z-1 -mx-[3px] w-1.5 flex-none cursor-col-resize bg-line hover:bg-accent has-[+.panel-hidden]:hidden max-[720px]:hidden!';

export interface Layout {
  top: TopBar;
  camera: { root: HTMLElement; video: HTMLVideoElement; canvas: HTMLCanvasElement; status: HTMLElement };
  sounds: SoundsPanel;
  code: HTMLElement;
  guide: HTMLElement;
  /** Collapses the side panel, or expands it, as its buttons do; in a narrow window, opens or closes its sheet. */
  toggleSidePanel(): void;
  /** Shrinks the sounds panel, or restores it; in a narrow window, opens or closes its sheet. */
  toggleSounds(): void;
  /** Expands the side panel on its Gestures tab, as a sheet in a narrow window. */
  showGestures(): void;
}

export function createLayout(root: HTMLElement): Layout {
  // The video's flip is the only CSS mirror: the overlay is mirrored in the hand coordinates instead. Contain
  // letterboxes it, never crops. The sliders take its place, while video and overlay stay in the page for a
  // successful Try again. While a step hint shows, the status cards and the sliders scroll below it.
  root.innerHTML = `
    <div class="flex min-h-0 flex-auto">
      <section class="panel panel-camera group/camera @container/camera relative min-w-[160px] flex-auto overflow-hidden bg-surface [&.panel-hidden]:hidden w-[70%] [--hint-height:52px] [--hint-top:12px] max-[720px]:w-auto!" id="panel-camera">
        <video id="cam" class="absolute inset-0 size-full scale-x-[-1] bg-black object-contain group-has-[.sliders]/camera:invisible" playsinline muted></video>
        <canvas id="overlay" class="absolute inset-0 size-full group-has-[.sliders]/camera:invisible"></canvas>
        <div class="absolute inset-0 flex flex-col items-center justify-center-safe gap-3 overflow-y-auto px-4 pt-4 pb-10 pointer-events-none has-[.sliders]:pointer-events-auto group-has-[.step-hint:not([hidden])]/camera:top-[calc(var(--hint-top)+var(--hint-height))]" id="camera-status"></div>
      </section>
      <section class="panel panel-side ${SIDE_PANEL}" id="panel-side" aria-label="Code and gestures">
        <div class="flex min-h-0 flex-auto flex-col" id="code-part"></div>
        <div class="min-h-0 flex-auto overflow-y-auto p-4 text-sm [&_dd]:mb-2 [&_dd]:text-muted [&_dt]:font-semibold [&_p]:mb-2" id="guide-part"></div>
      </section>
      <div class="side-strip flex w-11 flex-none border-l border-line bg-surface max-[720px]:hidden!"></div>
    </div>
  `;
  const top = createTopBar(root);
  const panels = [...root.querySelectorAll<HTMLElement>('.panel')];
  const code = root.querySelector<HTMLElement>('#code-part')!;
  const guide = root.querySelector<HTMLElement>('#guide-part')!;
  const camera = root.querySelector<HTMLElement>('#panel-camera')!;
  const sounds = createSoundsPanel(camera);
  const side = createSidePanel(root.querySelector('#panel-side')!, root.querySelector('.side-strip')!, code, guide, HIDDEN_PANEL);

  const sheets = createBottomSheets(root, camera, { sounds: root.querySelector('.sounds-panel')!, side: root.querySelector('#panel-side')! });

  // After the side panel has its saved state: Resizer sizes the panels still in the row.
  new Resize({ resizableElements: panels, resizerClassList: RESIZE_HANDLE, saveName: 'gibber-hands', classToCheck: HIDDEN_PANEL });

  return {
    top,
    camera: {
      root: camera,
      video: root.querySelector('#cam')!,
      canvas: root.querySelector('#overlay')!,
      status: root.querySelector('#camera-status')!
    },
    sounds,
    code,
    guide,
    toggleSidePanel: () => sheets.toggle('side') || side.toggle(),
    toggleSounds: () => sheets.toggle('sounds') || sounds.toggle(),
    showGestures() {
      // A bottom sheet shows the panel whether it is collapsed or not: its saved state for wide windows stays.
      side.showTab('gestures', !sheets.open('side'));
    }
  };
}
