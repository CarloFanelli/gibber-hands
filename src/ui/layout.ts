/**
 * Three resizable panels side by side: camera | instrument (audio controls) | live code above the gesture
 * guide, with a divider between them (codeGuideSplit). Resizer adds the drag handles and remembers the sizes;
 * a button in the instrument panel, or the C key, hides or shows the live code and its divider, for this
 * visit only, while the guide stays and its panel keeps its width. Narrow windows stack the panels (styles.css).
 */
import Resize from '../vendor/resizer/Resize';
import { mountCodeGuideSplit } from './codeGuideSplit';

export interface Layout {
  camera: { root: HTMLElement; video: HTMLVideoElement; canvas: HTMLCanvasElement; status: HTMLElement };
  instrument: HTMLElement;
  code: HTMLElement;
  guide: HTMLElement;
  /** Hides the live code, or shows it, as its button does. */
  toggleCode(): void;
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
      <button type="button" class="code-toggle" aria-controls="code-part"></button>
    </section>
    <section class="panel panel-code" id="panel-code">
      <div class="code-part" id="code-part"></div>
      <div class="code-split"></div>
      <div class="guide-part"></div>
    </section>
  `;
  const panels = [...root.querySelectorAll<HTMLElement>('.panel')];
  const codePanel = root.querySelector<HTMLElement>('#panel-code')!;
  const codePart = root.querySelector<HTMLElement>('#code-part')!;
  const codeSplit = root.querySelector<HTMLElement>('.code-split')!;
  const codeToggle = root.querySelector<HTMLButtonElement>('.code-toggle')!;
  const video = root.querySelector<HTMLVideoElement>('#cam')!;
  const canvas = root.querySelector<HTMLCanvasElement>('#overlay')!;

  // Resizer leaves panels with the class it checks out of the row; no panel takes it, so all three stay.
  new Resize({ resizableElements: panels, resizerClassList: 'resize-handle', saveName: 'gibber-hands', classToCheck: 'panel-hidden' });

  mountCodeGuideSplit(codePanel, codePart, codeSplit);

  let codeShown = true;
  function showCode(shown: boolean) {
    // The C key can hide the code under a focused Copy button: focus would fall back to the page.
    if (!shown && codePanel.contains(document.activeElement)) codeToggle.focus();
    codeShown = shown;
    codePart.hidden = !shown;
    codeSplit.hidden = !shown;
    codeToggle.textContent = shown ? 'Hide code' : 'Show code';
    codeToggle.setAttribute('aria-expanded', String(shown));
  }
  const toggleCode = () => showCode(!codeShown);
  showCode(true);
  codeToggle.addEventListener('click', toggleCode);

  return {
    camera: { root: root.querySelector('#panel-camera')!, video, canvas, status: root.querySelector('#camera-status')! },
    instrument: root.querySelector('.instrument-controls')!,
    code: codePart,
    guide: root.querySelector('.guide-part')!,
    toggleCode
  };
}
