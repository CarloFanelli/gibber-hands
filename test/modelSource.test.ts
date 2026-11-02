import { describe, expect, it } from 'vitest';
import installed from '../node_modules/@mediapipe/tasks-vision/package.json';
import {
  MEDIAPIPE_VERSION,
  MODEL_URL,
  WASM_BASE_URL,
  downloadFailure,
  downloadProgress,
  runtimeFailure
} from '../src/hands/modelSource';

const files = {
  wasmLoaderPath: `${WASM_BASE_URL}/vision_wasm_internal.js`,
  wasmBinaryPath: `${WASM_BASE_URL}/vision_wasm_internal.wasm`
};

describe('model source', () => {
  it('loads the runtime files of exactly the installed MediaPipe version', () => {
    expect(MEDIAPIPE_VERSION).toBe(installed.version);
    expect(WASM_BASE_URL).toContain(`@mediapipe/tasks-vision@${installed.version}/`);
  });
});

describe('downloadProgress', () => {
  it('has no percentage when the server sends no size', () => {
    expect(downloadProgress(1000, 0)).toBeNull();
    expect(downloadProgress(1000, Number.NaN)).toBeNull();
  });

  it('is the share of bytes received, held below 100% until the model is ready', () => {
    expect(downloadProgress(250, 1000)).toBe(0.25);
    expect(downloadProgress(1000, 1000)).toBe(0.99);
    expect(downloadProgress(1500, 1000)).toBe(0.99);
  });
});

describe('downloadFailure', () => {
  it('reports a stalled download as stalled', () => {
    expect(downloadFailure(true, true)).toEqual({ reason: 'stalled' });
  });

  it('reports no network when the browser is offline', () => {
    expect(downloadFailure(false, false)).toEqual({ reason: 'offline' });
  });

  it('names the model file when it could not be fetched online', () => {
    expect(downloadFailure(false, true)).toEqual({ reason: 'blocked', file: MODEL_URL.split('/').pop() });
  });
});

describe('runtimeFailure', () => {
  it('names the runtime loader when its script fails to load', () => {
    expect(runtimeFailure(new Event('error'), files, true)).toEqual({ reason: 'blocked', file: 'vision_wasm_internal.js' });
  });

  it('names the runtime binary when its download fails', () => {
    const abort = new Error('Aborted(both async and sync fetching of the wasm failed). Build with -sASSERTIONS for more info.');
    expect(runtimeFailure(abort, files, true)).toEqual({ reason: 'blocked', file: 'vision_wasm_internal.wasm' });
  });

  it('reports no network instead of a blocked file when offline', () => {
    expect(runtimeFailure(new Event('error'), files, false)).toEqual({ reason: 'offline' });
  });

  it('calls the model damaged for any other error', () => {
    expect(runtimeFailure(new Error('INVALID_ARGUMENT: not a model'), files, true)).toEqual({ reason: 'damaged' });
  });
});
