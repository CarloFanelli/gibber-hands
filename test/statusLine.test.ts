import { describe, expect, it } from 'vitest';
import type { CameraFailure } from '../src/hands/camera';
import type { StartupStatus } from '../src/hands/startup';
import type { EngineStatus } from '../src/synth/engine';
import { cameraMode, statusParts } from '../src/ui/statusLine';

/** The status as one line of words, camera first. */
const statusWords = (startup: StartupStatus, engine: EngineStatus) =>
  statusParts(startup, engine)
    .map((part) => part.words)
    .join(' · ');

const TRACKING: StartupStatus = { camera: { kind: 'live' }, model: { kind: 'ready' }, tracking: true };
const SLIDERS: StartupStatus = { camera: { kind: 'failed', failure: { reason: 'not-found' } }, model: { kind: 'ready' }, tracking: false };

describe('statusParts words', () => {
  it('names the camera and the audio', () => {
    expect(statusWords(TRACKING, { kind: 'off' })).toBe('Camera on · Audio off');
    expect(statusWords(TRACKING, { kind: 'starting' })).toBe('Camera on · Audio starting');
    expect(statusWords(TRACKING, { kind: 'on' })).toBe('Camera on · Audio on');
  });

  it('says the camera is off until it is live, and on while the hand model loads', () => {
    expect(statusWords({ camera: { kind: 'pending' }, model: { kind: 'loading', progress: null }, tracking: false }, { kind: 'off' })).toBe('Camera off · Audio off');
    expect(statusWords({ camera: { kind: 'live' }, model: { kind: 'loading', progress: 0.4 }, tracking: false }, { kind: 'off' })).toBe('Camera on · Audio off');
  });

  it('says why the camera is unavailable, and that the sliders play', () => {
    expect(statusWords(SLIDERS, { kind: 'off' })).toBe('No camera · Sliders · Audio off');
    const failed = (failure: CameraFailure): StartupStatus => ({ camera: { kind: 'failed', failure }, model: { kind: 'ready' }, tracking: false });
    expect(statusWords(failed({ reason: 'blocked' }), { kind: 'off' })).toBe('Camera blocked · Sliders · Audio off');
    expect(statusWords(failed({ reason: 'disconnected' }), { kind: 'off' })).toBe('Camera lost · Sliders · Audio off');
    expect(statusWords(failed({ reason: 'in-use' }), { kind: 'off' })).toBe('Camera busy · Sliders · Audio off');
    expect(statusWords(failed({ reason: 'insecure' }), { kind: 'off' })).toBe('Camera blocked · Sliders · Audio off');
    expect(statusWords(failed({ reason: 'other', errorName: 'AbortError' }), { kind: 'off' })).toBe('Camera failed · Sliders · Audio off');
  });

  it('says hand tracking is off when the hand model failed, even with the camera live', () => {
    expect(statusWords({ camera: { kind: 'live' }, model: { kind: 'failed', failure: { reason: 'offline' } }, tracking: false }, { kind: 'on' })).toBe('Hand tracking off · Sliders · Audio on');
  });

  it('says Audio failed when the audio engine failed', () => {
    expect(statusWords(TRACKING, { kind: 'failed', failure: { reason: 'network' } })).toBe('Camera on · Audio failed');
  });
});

describe('statusParts', () => {
  it('gives the camera and the audio an icon and a state, for the top bar', () => {
    expect(statusParts(TRACKING, { kind: 'off' })).toEqual([
      { icon: '◉', words: 'Camera on', state: 'on' },
      { icon: '♪', words: 'Audio off', state: 'off' }
    ]);
    expect(statusParts(SLIDERS, { kind: 'failed', failure: { reason: 'network' } })).toEqual([
      { icon: '◉', words: 'No camera · Sliders', state: 'failed' },
      { icon: '♪', words: 'Audio failed', state: 'failed' }
    ]);
  });
});

describe('cameraMode', () => {
  it('waits while the camera prompt is open', () => {
    expect(cameraMode({ camera: { kind: 'pending' }, model: { kind: 'loading', progress: 0.2 }, tracking: false })).toBe('waiting');
  });

  it('is live once the camera is, even while the hand model still loads', () => {
    expect(cameraMode({ camera: { kind: 'live' }, model: { kind: 'loading', progress: 0.5 }, tracking: false })).toBe('live');
    expect(cameraMode(TRACKING)).toBe('live');
  });

  it('plays with the sliders once the camera or the hand model has failed', () => {
    expect(cameraMode({ camera: { kind: 'failed', failure: { reason: 'blocked' } }, model: { kind: 'ready' }, tracking: false })).toBe('sliders');
    expect(cameraMode({ camera: { kind: 'live' }, model: { kind: 'failed', failure: { reason: 'offline' } }, tracking: false })).toBe('sliders');
  });
});
