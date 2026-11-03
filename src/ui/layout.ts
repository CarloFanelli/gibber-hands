/**
 * Three resizable panels side by side: camera | instrument (audio controls) | live code. Resizer adds the
 * drag handles and remembers the sizes; a button in the instrument panel, or the C key, hides or shows the
 * code panel, for this visit only. Narrow windows stack the panels (styles.css).
 */
import Resize from '../vendor/resizer/Resize';

/** Panels with this class leave the row, and Resizer resizes the others without them. */
const HIDDEN_PANEL = 'panel-hidden';

export interface Layout {
  camera: { root: HTMLElement; video: HTMLVideoElement; canvas: HTMLCanvasElement; status: HTMLElement };
  instrument: HTMLElement;
  liveCode: { show(code: string): void };
  /** Hides the code panel, or shows it, as its button does. */
  toggleCodePanel(): void;
}

export function createLayout(root: HTMLElement): Layout {
  root.innerHTML = `
    <section class="panel panel-camera" id="panel-camera">
      <video id="cam" playsinline muted></video>
      <canvas id="overlay"></canvas>
      <div class="camera-status" id="camera-status"></div>
      <p class="camera-privacy">Video stays on your device</p>
    </section>
    <section class="panel panel-instrument" id="panel-instrument">
      <div class="instrument-controls"></div>
      <button type="button" class="code-toggle" aria-controls="panel-code"></button>
    </section>
    <section class="panel panel-code" id="panel-code">
      <pre id="livecode"></pre>
    </section>
  `;
  const panels = [...root.querySelectorAll<HTMLElement>('.panel')];
  const codePanel = root.querySelector<HTMLElement>('#panel-code')!;
  const codeToggle = root.querySelector<HTMLButtonElement>('.code-toggle')!;
  const video = root.querySelector<HTMLVideoElement>('#cam')!;
  const canvas = root.querySelector<HTMLCanvasElement>('#overlay')!;
  const codeEl = root.querySelector<HTMLElement>('#livecode')!;

  new Resize({ resizableElements: panels, resizerClassList: 'resize-handle', saveName: 'gibber-hands', classToCheck: HIDDEN_PANEL });

  function showCodePanel(shown: boolean) {
    codePanel.classList.toggle(HIDDEN_PANEL, !shown);
    codeToggle.textContent = shown ? 'Hide code' : 'Show code';
    codeToggle.setAttribute('aria-expanded', String(shown));
  }
  const toggleCodePanel = () => showCodePanel(codePanel.classList.contains(HIDDEN_PANEL));
  showCodePanel(true);
  codeToggle.addEventListener('click', toggleCodePanel);

  return {
    camera: { root: root.querySelector('#panel-camera')!, video, canvas, status: root.querySelector('#camera-status')! },
    instrument: root.querySelector('.instrument-controls')!,
    liveCode: { show: (code) => { codeEl.textContent = code; } },
    toggleCodePanel
  };
}
