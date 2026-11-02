import { describe, expect, it } from 'vitest';
import { EngineDownloadError, audioSupported, engineFailure } from '../src/synth/engineFailure';

describe('audioSupported', () => {
  it('needs both an audio context and audio worklets', () => {
    expect(audioSupported({ AudioContext: class {}, AudioWorkletNode: class {} })).toBe(true);
    expect(audioSupported({ AudioContext: class {} })).toBe(false);
    expect(audioSupported({ AudioWorkletNode: class {} })).toBe(false);
    expect(audioSupported({})).toBe(false);
  });
});

describe('engineFailure', () => {
  it('reports a failed download of the sound worklet as network', () => {
    expect(engineFailure(new EngineDownloadError('HTTP 404'))).toEqual({ reason: 'network' });
  });

  it('names any other error', () => {
    expect(engineFailure(new DOMException('no device', 'NotSupportedError'))).toEqual({
      reason: 'other',
      errorName: 'NotSupportedError'
    });
    expect(engineFailure('boom')).toEqual({ reason: 'other', errorName: 'Error' });
  });
});
