import { describe, expect, it } from 'vitest';
import type { StartupStatus } from '../src/hands/startup';
import { cameraMode, statusWords } from '../src/ui/statusLine';

const TRACKING: StartupStatus = { camera: { kind: 'live' }, model: { kind: 'ready' }, tracking: true };
const SLIDERS: StartupStatus = { camera: { kind: 'failed', failure: { reason: 'not-found' } }, model: { kind: 'ready' }, tracking: false };

describe('statusWords', () => {
  it('names the camera and the audio', () => {
    expect(statusWords(TRACKING, { kind: 'off' })).toBe('Camera on · Audio off');
    expect(statusWords(TRACKING, { kind: 'starting' })).toBe('Camera on · Audio starting');
    expect(statusWords(TRACKING, { kind: 'on' })).toBe('Camera on · Audio on');
  });

  it('says the camera is off until it is live, and on while the hand model loads', () => {
    expect(statusWords({ camera: { kind: 'pending' }, model: { kind: 'loading', progress: null }, tracking: false }, { kind: 'off' })).toBe('Camera off · Audio off');
    expect(statusWords({ camera: { kind: 'live' }, model: { kind: 'loading', progress: 0.4 }, tracking: false }, { kind: 'off' })).toBe('Camera on · Audio off');
  });

  it('says Sliders when the camera is unavailable', () => {
    expect(statusWords(SLIDERS, { kind: 'off' })).toBe('Sliders · Audio off');
  });

  it('says Sliders when the hand model failed, even with the camera live', () => {
    expect(statusWords({ camera: { kind: 'live' }, model: { kind: 'failed', failure: { reason: 'offline' } }, tracking: false }, { kind: 'on' })).toBe('Sliders · Audio on');
  });

  it('says Audio error when the audio engine failed', () => {
    expect(statusWords(TRACKING, { kind: 'failed', failure: { reason: 'network' } })).toBe('Camera on · Audio error');
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
