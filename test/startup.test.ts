import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CameraFailure } from '../src/hands/camera';
import type { StartupStatus } from '../src/hands/startup';
import { EMPTY_HAND, emptyPair, type HandPair } from '../src/hands/types';

type Listener = (pair: HandPair) => void;

/** A hand source the test emits from and checks for stop(). */
function fakeSource() {
  const source = {
    listener: null as Listener | null,
    stop: vi.fn(),
    onState(cb: Listener) {
      source.listener = cb;
    }
  };
  return source;
}

/** A promise the test settles when it chooses. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const cameraStart = vi.fn();
let cameraEnded = () => {};
vi.mock('../src/hands/camera', () => ({
  createCamera: (_video: HTMLVideoElement, onEnded: () => void) => {
    cameraEnded = onEnded;
    return { start: cameraStart, stop: () => {} };
  }
}));

const loadHandModel = vi.fn();
vi.mock('../src/hands/model', () => ({ loadHandModel }));

const trackers: ReturnType<typeof fakeSource>[] = [];
const createTracker = vi.fn(() => {
  const tracker = fakeSource();
  trackers.push(tracker);
  return tracker;
});
vi.mock('../src/hands/tracker', () => ({ createTracker }));

const { createStartup } = await import('../src/hands/startup');

const recognizer = {};

function nextCameraRequest() {
  const request = deferred<CameraFailure | null>();
  cameraStart.mockReturnValueOnce(request.promise);
  return request;
}

function nextModelLoad() {
  const load = deferred<unknown>();
  loadHandModel.mockReturnValueOnce(load.promise);
  return load;
}

/** Lets every pending await in the startup run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function start() {
  const fallbacks: ReturnType<typeof fakeSource>[] = [];
  const startup = createStartup({} as HTMLVideoElement, () => {
    const fallback = fakeSource();
    fallbacks.push(fallback);
    return fallback;
  });
  const statuses: StartupStatus[] = [];
  const hands: HandPair[] = [];
  startup.onStatus((s) => statuses.push(s));
  startup.onHand((pair) => hands.push(pair));
  return { startup, fallbacks, hands, status: () => statuses.at(-1)! };
}

describe('createStartup', () => {
  beforeEach(() => {
    cameraStart.mockReset();
    loadHandModel.mockReset();
    createTracker.mockClear();
    trackers.length = 0;
  });

  it.each([
    ['camera', true],
    ['hand model', false]
  ])('starts tracking only once both are ready, %s first', async (_first, cameraFirst) => {
    const camera = nextCameraRequest();
    const model = nextModelLoad();
    const { status } = start();
    const steps = [() => camera.resolve(null), () => model.resolve({ recognizer })];
    if (!cameraFirst) steps.reverse();

    steps[0]!();
    await settle();
    expect(trackers).toHaveLength(0);
    expect(status().tracking).toBe(false);

    steps[1]!();
    await settle();
    expect(trackers).toHaveLength(1);
    expect(status()).toEqual({ camera: { kind: 'live' }, model: { kind: 'ready' }, tracking: true });
  });

  it('ignores Try again while the camera request runs, and asks again after a failure', async () => {
    const first = nextCameraRequest();
    nextModelLoad();
    const { startup, status } = start();

    startup.retryCamera();
    expect(cameraStart).toHaveBeenCalledTimes(1);

    first.resolve({ reason: 'blocked' });
    await settle();
    const second = nextCameraRequest();
    startup.retryCamera();
    startup.retryCamera();
    expect(cameraStart).toHaveBeenCalledTimes(2);
    expect(status().camera).toEqual({ kind: 'pending' });

    second.resolve(null);
    await settle();
    expect(status().camera).toEqual({ kind: 'live' });
  });

  it('loads the hand model again after a failure, but not when the browser cannot run it', async () => {
    nextCameraRequest();
    const first = nextModelLoad();
    const { startup } = start();

    startup.retryModel();
    expect(loadHandModel).toHaveBeenCalledTimes(1);

    first.resolve({ failure: { reason: 'offline' } });
    await settle();
    const second = nextModelLoad();
    startup.retryModel();
    expect(loadHandModel).toHaveBeenCalledTimes(2);

    second.resolve({ failure: { reason: 'unsupported' } });
    await settle();
    startup.retryModel();
    expect(loadHandModel).toHaveBeenCalledTimes(2);
  });

  it('shows the sliders from the first failure and stops them before tracking starts', async () => {
    const camera = nextCameraRequest();
    const model = nextModelLoad();
    const { startup, fallbacks, hands } = start();
    expect(fallbacks).toHaveLength(0);

    model.resolve({ failure: { reason: 'offline' } });
    await settle();
    expect(fallbacks).toHaveLength(1);
    const sliders = fallbacks[0]!;
    sliders.listener!(emptyPair(0));
    expect(hands).toHaveLength(1);

    // A working camera without a hand model keeps the sliders.
    camera.resolve(null);
    await settle();
    expect(fallbacks).toHaveLength(1);
    expect(sliders.stop).not.toHaveBeenCalled();

    const retry = nextModelLoad();
    startup.retryModel();
    retry.resolve({ recognizer });
    await settle();
    expect(sliders.stop).toHaveBeenCalledOnce();
    expect(trackers).toHaveLength(1);
    expect(sliders.stop.mock.invocationCallOrder[0]!).toBeLessThan(createTracker.mock.invocationCallOrder[0]!);
  });

  it('sends no hand on either side and brings back the sliders when the camera is lost', async () => {
    const camera = nextCameraRequest();
    const model = nextModelLoad();
    const { fallbacks, hands, status } = start();
    camera.resolve(null);
    model.resolve({ recognizer });
    await settle();
    const tracker = trackers[0]!;
    const seen: HandPair = { ...emptyPair(1), right: { state: { ...EMPTY_HAND, present: true, t: 1 }, landmarks: [] } };
    tracker.listener!(seen);

    cameraEnded();

    expect(tracker.stop).toHaveBeenCalledOnce();
    expect(hands).toHaveLength(2);
    expect(hands[0]).toBe(seen);
    for (const side of ['right', 'left'] as const) {
      expect(hands[1]![side]).toEqual({ state: expect.objectContaining({ present: false }), landmarks: null });
    }
    expect(status()).toMatchObject({ camera: { kind: 'failed', failure: { reason: 'disconnected' } }, tracking: false });
    expect(fallbacks).toHaveLength(1);
  });

  it('keeps "disconnected" when the camera is lost while it starts', async () => {
    const camera = nextCameraRequest();
    nextModelLoad();
    const { status } = start();

    cameraEnded();
    camera.resolve({ reason: 'other', errorName: 'AbortError' });
    await settle();

    expect(status().camera).toEqual({ kind: 'failed', failure: { reason: 'disconnected' } });
  });
});
