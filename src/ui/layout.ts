/**
 * Three resizable panels side by side: camera | instrument (presets + controls) | live code.
 *
 * TODO (milestone 3):
 *  - reuse your Resizer library (https://github.com/CarloFanelli/Resizer) for the panel handles,
 *    persisted under saveName 'gibber-hands'
 *  - reuse drag-kit (https://github.com/CarloFanelli/drag-kit) to drag presets onto the instrument panel
 *  - a "Start audio" button (required by autoplay policy) that calls synth.start()
 *  - keyboard shortcuts: 1–6 select preset, M mute, Space hold, ? shows the shortcut sheet
 *  - mobile: panels stack vertically; camera panel shows sliders when no webcam
 */
import type { HandState } from '../hands/types';
import type { Preset } from '../synth/presets';

export interface Layout {
  camera: { root: HTMLElement; video: HTMLVideoElement; canvas: HTMLCanvasElement; status: HTMLElement };
  presets: { render(list: Preset[], onPick: (p: Preset) => void): void };
  liveCode: { show(code: string): void };
  overlay: { draw(s: HandState): void };
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
      <button id="start">Start audio</button>
      <div id="presets"></div>
    </section>
    <section class="panel panel-code" id="panel-code">
      <pre id="livecode"></pre>
    </section>
  `;
  const video = root.querySelector<HTMLVideoElement>('#cam')!;
  const canvas = root.querySelector<HTMLCanvasElement>('#overlay')!;
  const presetsEl = root.querySelector<HTMLElement>('#presets')!;
  const codeEl = root.querySelector<HTMLElement>('#livecode')!;

  return {
    camera: { root: root.querySelector('#panel-camera')!, video, canvas, status: root.querySelector('#camera-status')! },
    presets: {
      render(list, onPick) {
        presetsEl.innerHTML = '';
        for (const p of list) {
          const b = document.createElement('button');
          b.className = 'preset';
          b.textContent = p.name;
          b.onclick = () => onPick(p);
          presetsEl.appendChild(b);
        }
      }
    },
    liveCode: { show: (code) => { codeEl.textContent = code; } },
    overlay: {
      draw(s) {
        // TODO (milestone 1): draw landmarks + gesture label on `canvas`, mirrored like the video.
        void s;
      }
    }
  };
}
