/**
 * The status in the top bar: the camera's part and the audio's, each an icon coloured by its state and words,
 * for example "Camera on" and "Audio off". A narrow top bar shows the icons only; the words stay their label.
 * Each part's tooltip gives its words, then how to turn it on or off.
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

const CAMERA_FAILED_HOW: Record<CameraFailure['reason'], string> = {
  insecure: 'To turn it on, open the https link of this page',
  blocked: 'To turn it on, click the camera icon in the address bar, allow the camera, then press Try again',
  'not-found': 'To turn it on, connect a camera, then press Try again',
  'in-use': 'To turn it on, close the other app using the camera, then press Try again',
  disconnected: 'To turn it on, reconnect the camera, then press Try again',
  other: 'To turn it on, press Try again on the camera view'
};
const AUDIO_HOW: Record<Exclude<EngineStatus['kind'], 'failed'>, string> = {
  off: 'To turn it on, press Start audio or Space',
  starting: 'The audio engine is loading',
  on: 'To turn it off, press Stop audio or Space'
};

/** How to turn each part of the status on or off, camera first: the tooltip after its words. */
export function statusHows(startup: StartupStatus, engine: EngineStatus): [string, string] {
  const mode = cameraMode(startup);
  let camera: string;
  if (mode === 'live') camera = "To turn it off, block the camera in the browser's site settings (the camera icon in the address bar)";
  else if (mode === 'waiting') camera = 'To turn it on, allow the camera when the browser asks';
  else if (startup.camera.kind === 'failed') camera = CAMERA_FAILED_HOW[startup.camera.failure.reason];
  else if (startup.model.kind === 'failed' && startup.model.failure.reason === 'unsupported') camera = "This browser can't run hand tracking: try a current Chrome";
  else camera = 'To turn hand tracking on, press Try again on the camera view';
  let audio: string;
  if (engine.kind !== 'failed') audio = AUDIO_HOW[engine.kind];
  else if (engine.failure.reason === 'unsupported') audio = "This browser can't run the audio engine: try a current Chrome";
  else audio = 'To turn it on, press Try again or Space';
  return [camera, audio];
}

export interface StatusLine {
  show(startup: StartupStatus, engine: EngineStatus): void;
}

export function createStatusLine(root: HTMLElement): StatusLine {
  const line = document.createElement('p');
  line.className = 'flex gap-3.5 text-sm text-muted';
  root.append(line);
  let shown = '';
  return {
    show(startup, engine) {
      const parts = statusParts(startup, engine);
      const hows = statusHows(startup, engine);
      const key = JSON.stringify([parts, hows]);
      if (key === shown) return;
      shown = key;
      line.replaceChildren(
        ...parts.map((part, i) => {
          const item = document.createElement('span');
          item.className = 'status-part group inline-flex items-center gap-1.5 data-[state=failed]:text-warn';
          item.dataset.state = part.state;
          item.title = `${part.words}. ${hows[i]}`;
          const icon = document.createElement('span');
          icon.className = 'text-[15px] group-data-[state=on]:text-accent';
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = part.icon;
          const words = document.createElement('span');
          words.className = '@max-[900px]/top-bar:sr-only';
          words.textContent = part.words;
          item.append(icon, words);
          return item;
        })
      );
    }
  };
}
