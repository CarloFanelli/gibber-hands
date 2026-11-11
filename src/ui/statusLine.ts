/**
 * The status in the top bar: the camera's part and the audio's, each an icon coloured by its state and words,
 * for example "Camera on" and "Audio off". A narrow top bar shows the icons only; the words stay their label.
 */
import type { CameraFailure } from '../hands/camera';
import type { StartupStatus } from '../hands/startup';
import type { EngineStatus } from '../synth/engine';

/** How the visitor plays: waiting for the camera, with the camera, or with the sliders that replace it. */
export type CameraMode = 'waiting' | 'live' | 'sliders';

/** The sliders stand in once the camera or the hand model has failed, until tracking runs (hands/startup.ts). */
export function cameraMode(s: StartupStatus): CameraMode {
  if (!s.tracking && (s.camera.kind === 'failed' || s.model.kind === 'failed')) return 'sliders';
  return s.camera.kind === 'pending' ? 'waiting' : 'live';
}

const CAMERA_FAILED_WORDS: Record<CameraFailure['reason'], string> = {
  insecure: 'Camera blocked',
  blocked: 'Camera blocked',
  'not-found': 'No camera',
  'in-use': 'Camera busy',
  disconnected: 'Camera lost',
  other: 'Camera failed'
};
const AUDIO_WORDS: Record<EngineStatus['kind'], string> = {
  off: 'Audio off',
  starting: 'Audio starting',
  on: 'Audio on',
  failed: 'Audio failed'
};

/** One part of the status: an icon, its words, and the state its colour shows. */
export interface StatusPart {
  icon: string;
  words: string;
  state: 'on' | 'off' | 'failed';
}

/** The camera's part, then the audio's: while the sliders play, why the camera can't, and "Sliders". */
export function statusParts(startup: StartupStatus, engine: EngineStatus): StatusPart[] {
  const mode = cameraMode(startup);
  let camera: StatusPart;
  if (mode === 'sliders') {
    const why = startup.camera.kind === 'failed' ? CAMERA_FAILED_WORDS[startup.camera.failure.reason] : 'Hand tracking off';
    camera = { icon: '◉', words: `${why} · Sliders`, state: 'failed' };
  } else {
    camera = { icon: '◉', words: mode === 'live' ? 'Camera on' : 'Camera off', state: mode === 'live' ? 'on' : 'off' };
  }
  const audioState = engine.kind === 'on' ? 'on' : engine.kind === 'failed' ? 'failed' : 'off';
  return [camera, { icon: '♪', words: AUDIO_WORDS[engine.kind], state: audioState }];
}

export interface StatusLine {
  show(startup: StartupStatus, engine: EngineStatus): void;
}

export function createStatusLine(root: HTMLElement): StatusLine {
  const line = document.createElement('p');
  line.className = 'status-line';
  root.append(line);
  let shown = '';
  return {
    show(startup, engine) {
      const parts = statusParts(startup, engine);
      const key = JSON.stringify(parts);
      if (key === shown) return;
      shown = key;
      line.replaceChildren(
        ...parts.map((part) => {
          const item = document.createElement('span');
          item.className = 'status-part';
          item.dataset.state = part.state;
          item.title = part.words;
          const icon = document.createElement('span');
          icon.className = 'status-icon';
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = part.icon;
          const words = document.createElement('span');
          words.className = 'status-words';
          words.textContent = part.words;
          item.append(icon, words);
          return item;
        })
      );
    }
  };
}
