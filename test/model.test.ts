import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createFromOptions = vi.fn();
const forVisionTasks = vi.fn((base: string) =>
  Promise.resolve({ wasmLoaderPath: `${base}/vision_wasm_internal.js`, wasmBinaryPath: `${base}/vision_wasm_internal.wasm` })
);
vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks },
  GestureRecognizer: { createFromOptions }
}));

const { loadHandModel } = await import('../src/hands/model');

function modelResponse(bytes: number) {
  return new Response(new Uint8Array(bytes), { headers: { 'Content-Length': String(bytes) } });
}

describe('loadHandModel', () => {
  beforeEach(() => {
    createFromOptions.mockReset();
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('creates a two-hand video recognizer from the downloaded bytes, without a canvas', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(modelResponse(64)));
    createFromOptions.mockResolvedValue('recognizer');
    const progress: (number | null)[] = [];

    expect(await loadHandModel((p) => progress.push(p))).toEqual({ recognizer: 'recognizer' });

    const options = createFromOptions.mock.calls[0]![1];
    expect(options).toMatchObject({ runningMode: 'VIDEO', numHands: 2, baseOptions: { delegate: 'GPU' } });
    expect(options.baseOptions.modelAssetBuffer).toBeInstanceOf(Uint8Array);
    expect(options.baseOptions.modelAssetBuffer.byteLength).toBe(64);
    expect(options).not.toHaveProperty('canvas');
    expect(progress.at(-1)).toBe(0.99);
  });

  it('falls back to the processor without reporting the graphics failure', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(modelResponse(8)));
    createFromOptions.mockRejectedValueOnce(new Error('WebGL unavailable')).mockResolvedValueOnce('recognizer');

    expect(await loadHandModel(() => {})).toEqual({ recognizer: 'recognizer' });
    expect(createFromOptions.mock.calls.map((call) => call[1].baseOptions.delegate)).toEqual(['GPU', 'CPU']);
  });

  it('reports the processor attempt failure, not the graphics one', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(modelResponse(8)));
    createFromOptions.mockRejectedValueOnce(new Error('WebGL unavailable')).mockRejectedValueOnce(new Event('error'));

    expect(await loadHandModel(() => {})).toEqual({ failure: { reason: 'blocked', file: 'vision_wasm_internal.js' } });
  });

  it('reports a runtime that fails to set up instead of loading forever', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(modelResponse(8)));
    forVisionTasks.mockRejectedValueOnce(new Error('setup failed'));

    expect(await loadHandModel(() => {})).toEqual({ failure: { reason: 'damaged' } });
    expect(createFromOptions).not.toHaveBeenCalled();
  });

  it('gives up after 30 s without progress', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(new DOMException('', 'AbortError'))))
    );

    const load = loadHandModel(() => {});
    await vi.advanceTimersByTimeAsync(29_999);
    let settled = false;
    void load.then(() => { settled = true; });
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await load).toEqual({ failure: { reason: 'stalled' } });
  });

  it('says the browser cannot run hand tracking without WebAssembly', async () => {
    vi.stubGlobal('WebAssembly', undefined);
    expect(await loadHandModel(() => {})).toEqual({ failure: { reason: 'unsupported' } });
  });
});
