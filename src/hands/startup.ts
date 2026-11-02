/**
 * Starts the camera and the hand model together on page load, reports their status, and runs the
 * tracker once both are ready, whichever comes last. Each has at most one request in flight;
 * Try again is ignored while one runs.
 */
import type { GestureRecognizer } from '@mediapipe/tasks-vision';
import { createCamera, type CameraFailure } from './camera';
import { loadHandModel } from './model';
import type { ModelFailure } from './modelSource';
import { createTracker, type HandSource } from './tracker';
import { EMPTY_HAND, type HandState, type Point } from './types';

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
  /** True while the tracker runs: the camera is live and the model is ready. */
  tracking: boolean;
}

export interface Startup {
  /** Calls `cb` with the current status at once, then on every change. */
  onStatus(cb: (s: StartupStatus) => void): void;
  /** Receives every HandState the tracker produces, and an empty one when tracking stops. */
  onHand(cb: (s: HandState, landmarks: Point[] | null) => void): void;
  /** Asks for the camera again after a failure; ignored otherwise. */
  retryCamera(): void;
  /** Loads the hand model again after a failure the browser can recover from; ignored otherwise. */
  retryModel(): void;
}

export function createStartup(video: HTMLVideoElement): Startup {
  let camera: CameraStatus = { kind: 'pending' };
  let model: ModelStatus = { kind: 'loading', progress: null };
  let recognizer: GestureRecognizer | null = null;
  let tracker: HandSource | null = null;
  let statusListener: ((s: StartupStatus) => void) | null = null;
  let handListener: ((s: HandState, landmarks: Point[] | null) => void) | null = null;

  const emit = () => statusListener?.({ camera, model, tracking: tracker !== null });

  /** Starts or stops the tracker to match the camera and model, then reports the status. */
  function update() {
    if (!tracker && recognizer && camera.kind === 'live') {
      tracker = createTracker(video, recognizer);
      tracker.onState((s, landmarks) => handListener?.(s, landmarks));
    } else if (tracker && camera.kind !== 'live') {
      tracker.stop();
      tracker = null;
      handListener?.({ ...EMPTY_HAND, t: performance.now() }, null);
    }
    emit();
  }

  const cam = createCamera(video, () => {
    cam.stop();
    camera = { kind: 'failed', failure: { reason: 'disconnected' } };
    update();
  });

  async function requestCamera() {
    camera = { kind: 'pending' };
    update();
    const failure = await cam.start();
    camera = failure ? { kind: 'failed', failure } : { kind: 'live' };
    update();
  }

  async function loadModel() {
    model = { kind: 'loading', progress: null };
    update();
    const load = await loadHandModel((progress) => {
      model = { kind: 'loading', progress };
      emit();
    });
    if ('failure' in load) {
      model = { kind: 'failed', failure: load.failure };
    } else {
      model = { kind: 'ready' };
      recognizer = load.recognizer;
    }
    update();
  }

  void requestCamera();
  void loadModel();

  return {
    onStatus(cb) {
      statusListener = cb;
      emit();
    },
    onHand(cb) {
      handListener = cb;
    },
    retryCamera() {
      if (camera.kind === 'failed') void requestCamera();
    },
    retryModel() {
      if (model.kind === 'failed' && model.failure.reason !== 'unsupported') void loadModel();
    }
  };
}
