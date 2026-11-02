/**
 * Where the hand model and the MediaPipe runtime come from, and why loading them failed.
 * No MediaPipe import here, so tests run without the browser bundle.
 */

/** Must equal the installed @mediapipe/tasks-vision version: the runtime files are fetched by version. */
export const MEDIAPIPE_VERSION = '1.2.0';
export const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';
export const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
export const STALL_TIMEOUT_MS = 30_000;
/** The percentage stops here until the recognizer exists, because the runtime still loads after the model. */
const MAX_PROGRESS_BEFORE_READY = 0.99;
/** Emscripten's abort message when the runtime binary can't be fetched. */
const WASM_FETCH_FAILED = 'fetching of the wasm failed';

export type ModelFailure =
  | { reason: 'unsupported' | 'offline' | 'stalled' | 'damaged' }
  | { reason: 'blocked'; file: string };

/** Fraction of the model received, or null when the server sent no size. */
export function downloadProgress(received: number, total: number): number | null {
  return total > 0 ? Math.min(received / total, MAX_PROGRESS_BEFORE_READY) : null;
}

export function downloadFailure(stalled: boolean, online: boolean): ModelFailure {
  if (stalled) return { reason: 'stalled' };
  return unreachable(MODEL_URL, online);
}

/**
 * Failure of the runtime start, given the files it was loading. The loader script fails with the
 * <script> element's error Event; the binary fails with an Emscripten abort; anything else is the model.
 */
export function runtimeFailure(
  error: unknown,
  files: { wasmLoaderPath: string; wasmBinaryPath: string },
  online: boolean
): ModelFailure {
  if (error instanceof Event) return unreachable(files.wasmLoaderPath, online);
  if (error instanceof Error && error.message.includes(WASM_FETCH_FAILED)) return unreachable(files.wasmBinaryPath, online);
  return { reason: 'damaged' };
}

function unreachable(url: string, online: boolean): ModelFailure {
  return online ? { reason: 'blocked', file: url.slice(url.lastIndexOf('/') + 1) } : { reason: 'offline' };
}
