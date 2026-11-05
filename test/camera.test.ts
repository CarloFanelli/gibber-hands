import { afterEach, describe, expect, it, vi } from 'vitest';
import { cameraFailure, createCamera } from '../src/hands/camera';

describe('cameraFailure', () => {
  it('names an insecure page whatever the browser error', () => {
    expect(cameraFailure('TypeError', false)).toEqual({ reason: 'insecure' });
    expect(cameraFailure('NotAllowedError', false)).toEqual({ reason: 'insecure' });
  });

  it.each([
    ['NotAllowedError', 'blocked'],
    ['NotFoundError', 'not-found'],
    ['OverconstrainedError', 'not-found'],
    ['NotReadableError', 'in-use']
  ])('maps %s to %s', (errorName, reason) => {
    expect(cameraFailure(errorName, true)).toEqual({ reason });
  });

  it('keeps the browser error name for any other error', () => {
    expect(cameraFailure('AbortError', true)).toEqual({ reason: 'other', errorName: 'AbortError' });
  });
});

describe('createCamera', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function fakeStream() {
    const track = { live: true, stop: () => { track.live = false; }, addEventListener: vi.fn() };
    return { track, stream: { getTracks: () => [track], getVideoTracks: () => [track] } };
  }

  function fakeVideo() {
    return { srcObject: null, play: () => Promise.resolve() } as unknown as HTMLVideoElement;
  }

  it('asks for the front camera without audio and stops the previous stream before asking again', async () => {
    const streams = [fakeStream(), fakeStream()];
    const getUserMedia = vi.fn();
    getUserMedia.mockResolvedValueOnce(streams[0]!.stream).mockResolvedValueOnce(streams[1]!.stream);
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });

    const camera = createCamera(fakeVideo(), () => {});
    expect(await camera.start()).toBeNull();
    expect(await camera.start()).toBeNull();

    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'user' }, audio: false });
    expect(streams.map((s) => s.track.live)).toEqual([false, true]);
  });

  it('reports an insecure page instead of throwing', async () => {
    vi.stubGlobal('isSecureContext', false);
    vi.stubGlobal('navigator', {});

    await expect(createCamera(fakeVideo(), () => {}).start()).resolves.toEqual({ reason: 'insecure' });
  });

  it('reports a refused request by its reason', async () => {
    vi.stubGlobal('isSecureContext', true);
    const refusal = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => Promise.reject(refusal) } });

    await expect(createCamera(fakeVideo(), () => {}).start()).resolves.toEqual({ reason: 'blocked' });
  });
});
