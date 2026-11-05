/**
 * Three resizable panels side by side: camera | instrument (audio controls) | live code.
 *
 * TODO (milestone 3):
 *  - reuse your Resizer library (https://github.com/CarloFanelli/Resizer) for the panel handles,
 *    persisted under saveName 'gibber-hands'
 *  - reuse drag-kit (https://github.com/CarloFanelli/drag-kit) to drag presets onto the instrument panel
 *  - keyboard shortcuts: 1–6 select preset, M mute, Space hold, ? shows the shortcut sheet
 *  - mobile: panels stack vertically; camera panel shows sliders when no webcam
 */

export interface Layout {
  camera: { root: HTMLElement; video: HTMLVideoElement; canvas: HTMLCanvasElement; status: HTMLElement };
  instrument: HTMLElement;
  liveCode: { show(code: string): void };
}

export function createLayout(root: HTMLElement): Layout {
  root.innerHTML = `
    <section class="panel panel-camera" id="panel-camera">
      <video id="cam" playsinline muted></video>
      <canvas id="overlay"></canvas>
      <div class="camera-status" id="camera-status"></div>
      <p class="camera-privacy">Video stays on your device</p>
    </section>
    <section class="panel panel-instrument" id="panel-instrument"></section>
    <section class="panel panel-code" id="panel-code">
      <pre id="livecode"></pre>
    </section>
  `;
  const video = root.querySelector<HTMLVideoElement>('#cam')!;
  const canvas = root.querySelector<HTMLCanvasElement>('#overlay')!;
  const codeEl = root.querySelector<HTMLElement>('#livecode')!;

  return {
    camera: { root: root.querySelector('#panel-camera')!, video, canvas, status: root.querySelector('#camera-status')! },
    instrument: root.querySelector('#panel-instrument')!,
    liveCode: { show: (code) => { codeEl.textContent = code; } }
  };
}
