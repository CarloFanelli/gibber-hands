/**
 * Downloads the hand model with progress, then starts the MediaPipe runtime with it.
 * Only one load may run at a time: the runtime loader uses a page-wide global.
 */
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import {
  MODEL_URL,
  STALL_TIMEOUT_MS,
  WASM_BASE_URL,
  downloadFailure,
  downloadProgress,
  runtimeFailure,
  type ModelFailure
} from './modelSource';

type ModelLoad = { recognizer: GestureRecognizer } | { failure: ModelFailure };

export async function loadHandModel(onProgress: (fraction: number | null) => void): Promise<ModelLoad> {
  if (typeof WebAssembly === 'undefined') return { failure: { reason: 'unsupported' } };

  const stall = new AbortController();
  let model: Uint8Array;
  try {
    model = await download(onProgress, stall);
  } catch {
    return { failure: downloadFailure(stall.signal.aborted, navigator.onLine) };
  }

  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
  // Never pass the overlay canvas: MediaPipe would take a WebGL context on it. It makes its own.
  const create = (delegate: 'GPU' | 'CPU') =>
    GestureRecognizer.createFromOptions(fileset, {
      baseOptions: { modelAssetBuffer: model, delegate },
      runningMode: 'VIDEO',
      numHands: 1
    });
  try {
    // A graphics failure is silent: only the processor attempt's error explains what went wrong.
    return { recognizer: await create('GPU').catch(() => create('CPU')) };
  } catch (err) {
    return { failure: runtimeFailure(err, fileset, navigator.onLine) };
  }
}

/** Our own fetch, because MediaPipe's model download reports no progress. Aborts after a stall. */
async function download(onProgress: (fraction: number | null) => void, stall: AbortController): Promise<Uint8Array> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const watch = () => {
    clearTimeout(timer);
    timer = setTimeout(() => stall.abort(), STALL_TIMEOUT_MS);
  };
  watch();
  try {
    const res = await fetch(MODEL_URL, { signal: stall.signal });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const total = Number(res.headers.get('Content-Length'));
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      watch();
      chunks.push(chunk.value);
      received += chunk.value.byteLength;
      onProgress(downloadProgress(received, total));
    }
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.byteLength;
    }
    return bytes;
  } finally {
    clearTimeout(timer);
  }
}
