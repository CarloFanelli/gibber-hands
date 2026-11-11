/**
 * The top bar (topBar), then two resizable panels side by side: the camera stage, with the sounds panel
 * floating over it (soundsPanel), and the side panel, which holds the live code and the gesture guide as tabs
 * (sidePanel). Resizer adds the drag handle and remembers the sizes; the side panel stays between 280 px and
 * half the row (styles.css). Collapsed, it leaves the row and a narrow strip takes its place. Narrow windows
 * stack the panels (styles.css).
 */
import Resize from '../vendor/resizer/Resize';
import { createSidePanel } from './sidePanel';
import { createSoundsPanel, type SoundsPanel } from './soundsPanel';
import { createTopBar, type TopBar } from './topBar';

/** The class Resizer leaves out of the row. */
const HIDDEN_PANEL = 'panel-hidden';

export interface Layout {
  top: TopBar;
  camera: { root: HTMLElement; video: HTMLVideoElement; canvas: HTMLCanvasElement; status: HTMLElement };
  sounds: SoundsPanel;
  code: HTMLElement;
  guide: HTMLElement;
  /** Collapses the side panel, or expands it, as its buttons do. */
  toggleSidePanel(): void;
}

export function createLayout(root: HTMLElement): Layout {
  root.innerHTML = `
    <div class="panels">
      <section class="panel panel-camera" id="panel-camera">
        <video id="cam" playsinline muted></video>
        <canvas id="overlay"></canvas>
        <div class="camera-status" id="camera-status"></div>
      </section>
      <section class="panel panel-side" id="panel-side" aria-label="Code and gestures">
        <div class="code-part" id="code-part"></div>
        <div class="guide-part" id="guide-part"></div>
      </section>
      <div class="side-strip"></div>
    </div>
  `;
  const top = createTopBar(root);
  const panels = [...root.querySelectorAll<HTMLElement>('.panel')];
  const code = root.querySelector<HTMLElement>('#code-part')!;
  const guide = root.querySelector<HTMLElement>('#guide-part')!;
  const camera = root.querySelector<HTMLElement>('#panel-camera')!;
  const sounds = createSoundsPanel(camera);
  const side = createSidePanel(root.querySelector('#panel-side')!, root.querySelector('.side-strip')!, code, guide, HIDDEN_PANEL);

  // After the side panel has its saved state: Resizer sizes the panels still in the row.
  new Resize({ resizableElements: panels, resizerClassList: 'resize-handle', saveName: 'gibber-hands', classToCheck: HIDDEN_PANEL });

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
    toggleSidePanel: side.toggle
  };
}
