/**
 * Starts the camera and the hand model together on page load, reports their status, and keeps one
 * HandState source active: the tracker once both are ready (whichever comes last), or the fallback
 * from the first failure until tracking starts. Each request has at most one in flight; Try again is
 * ignored while one runs.
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
  /** Receives every HandState of the active source, and an empty one when tracking stops. */
  onHand(cb: (s: HandState, landmarks: Point[] | null) => void): void;
  /** Asks for the camera again after a failure; ignored otherwise. */
  retryCamera(): void;
  /** Loads the hand model again after a failure the browser can recover from; ignored otherwise. */
  retryModel(): void;
}

/** `createFallback` builds the source used while the camera or the model is unavailable. */
export function createStartup(video: HTMLVideoElement, createFallback: () => HandSource): Startup {
  let camera: CameraStatus = { kind: 'pending' };
  let model: ModelStatus = { kind: 'loading', progress: null };
  let recognizer: GestureRecognizer | null = null;
  let tracker: HandSource | null = null;
  let fallback: HandSource | null = null;
  let statusListener: ((s: StartupStatus) => void) | null = null;
  let handListener: ((s: HandState, landmarks: Point[] | null) => void) | null = null;

  const emit = () => statusListener?.({ camera, model, tracking: tracker !== null });

  const relay = (s: HandState, landmarks: Point[] | null) => handListener?.(s, landmarks);

  /** Switches the active source to match the camera and model, then reports the status. */
  function update() {
    const trackable = recognizer !== null && camera.kind === 'live';
    if (tracker && !trackable) {
      tracker.stop();
      tracker = null;
      handListener?.({ ...EMPTY_HAND, t: performance.now() }, null);
    }
    // Stopped before the tracker starts, so the two never emit together.
    if (fallback && trackable) {
      fallback.stop();
      fallback = null;
    }
    if (!fallback && !trackable && (camera.kind === 'failed' || model.kind === 'failed')) {
      fallback = createFallback();
      fallback.onState(relay);
    }
    if (!tracker && trackable && recognizer) {
      tracker = createTracker(video, recognizer);
      tracker.onState(relay);
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
