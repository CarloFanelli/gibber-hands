/**
 * The status line at the top of the instrument panel: camera and audio status in words, for example
 * "Camera on · Audio off".
 */
import type { StartupStatus } from '../hands/startup';
import type { EngineStatus } from '../synth/engine';

/** How the visitor plays: waiting for the camera, with the camera, or with the sliders that replace it. */
export type CameraMode = 'waiting' | 'live' | 'sliders';

/** The sliders stand in once the camera or the hand model has failed, until tracking runs (hands/startup.ts). */
export function cameraMode(s: StartupStatus): CameraMode {
  if (!s.tracking && (s.camera.kind === 'failed' || s.model.kind === 'failed')) return 'sliders';
  return s.camera.kind === 'pending' ? 'waiting' : 'live';
}

const CAMERA_WORDS: Record<CameraMode, string> = { waiting: 'Camera off', live: 'Camera on', sliders: 'Sliders' };
const AUDIO_WORDS: Record<EngineStatus['kind'], string> = {
  off: 'Audio off',
  starting: 'Audio starting',
  on: 'Audio on',
  failed: 'Audio error'
};

export function statusWords(startup: StartupStatus, engine: EngineStatus): string {
  return `${CAMERA_WORDS[cameraMode(startup)]} · ${AUDIO_WORDS[engine.kind]}`;
}

export interface StatusLine {
  show(startup: StartupStatus, engine: EngineStatus): void;
}

export function createStatusLine(root: HTMLElement): StatusLine {
  const line = document.createElement('p');
  line.className = 'status-line';
  root.append(line);
  return {
    show(startup, engine) {
      const words = statusWords(startup, engine);
      if (line.textContent !== words) line.textContent = words;
    }
  };
}
