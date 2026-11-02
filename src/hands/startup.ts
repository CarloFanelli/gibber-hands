/**
 * Starts the camera and the hand model together on page load and reports their status.
 * Each has at most one request in flight; Try again is ignored while one runs.
 */
import { createCamera, type CameraFailure } from './camera';
import { loadHandModel } from './model';
import type { ModelFailure } from './modelSource';

type CameraStatus =
  | { kind: 'pending' }
  | { kind: 'live' }
  | { kind: 'failed'; failure: CameraFailure };

type ModelStatus =
  | { kind: 'loading'; progress: number | null }
  | { kind: 'ready' }
  | { kind: 'failed'; failure: ModelFailure };

export interface StartupStatus {
  camera: CameraStatus;
  model: ModelStatus;
}

export interface Startup {
  /** Calls `cb` with the current status at once, then on every change. */
  onStatus(cb: (s: StartupStatus) => void): void;
  /** Asks for the camera again after a failure; ignored otherwise. */
  retryCamera(): void;
  /** Loads the hand model again after a failure the browser can recover from; ignored otherwise. */
  retryModel(): void;
}

export function createStartup(video: HTMLVideoElement): Startup {
  let camera: CameraStatus = { kind: 'pending' };
  let model: ModelStatus = { kind: 'loading', progress: null };
  let listener: ((s: StartupStatus) => void) | null = null;

  const emit = () => listener?.({ camera, model });
  const setCamera = (next: CameraStatus) => {
    camera = next;
    emit();
  };
  const setModel = (next: ModelStatus) => {
    model = next;
    emit();
  };

  const cam = createCamera(video, () => {
    cam.stop();
    setCamera({ kind: 'failed', failure: { reason: 'disconnected' } });
  });

  async function requestCamera() {
    setCamera({ kind: 'pending' });
    const failure = await cam.start();
    setCamera(failure ? { kind: 'failed', failure } : { kind: 'live' });
  }

  async function loadModel() {
    setModel({ kind: 'loading', progress: null });
    const load = await loadHandModel((progress) => setModel({ kind: 'loading', progress }));
    setModel('failure' in load ? { kind: 'failed', failure: load.failure } : { kind: 'ready' });
  }

  void requestCamera();
  void loadModel();

  return {
    onStatus(cb) {
      listener = cb;
      emit();
    },
    retryCamera() {
      if (camera.kind === 'failed') void requestCamera();
    },
    retryModel() {
      if (model.kind === 'failed' && model.failure.reason !== 'unsupported') void loadModel();
    }
  };
}
