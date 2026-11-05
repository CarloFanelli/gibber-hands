import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STEP_WORDS, firstSoundTimer, nextStep, type Step } from '../src/ui/stepHints';

describe('nextStep', () => {
  it('asks for the camera first', () => {
    expect(nextStep({ camera: 'waiting', hand: false, audio: false })).toBe('camera');
    expect(nextStep({ camera: 'waiting', hand: false, audio: true })).toBe('camera');
  });

  it('then the hand, then audio, then the squeeze', () => {
    expect(nextStep({ camera: 'live', hand: false, audio: false })).toBe('hand');
    expect(nextStep({ camera: 'live', hand: true, audio: false })).toBe('audio');
    expect(nextStep({ camera: 'live', hand: true, audio: true })).toBe('squeeze');
  });

  it('asks for the hand when audio started first, and again when the hand leaves', () => {
    expect(nextStep({ camera: 'live', hand: false, audio: true })).toBe('hand');
  });

  it('with the sliders: start audio, then lower the pinch slider', () => {
    expect(nextStep({ camera: 'sliders', hand: true, audio: false })).toBe('audio');
    expect(nextStep({ camera: 'sliders', hand: true, audio: true })).toBe('pinch-slider');
  });

  it('says each step in four words or fewer', () => {
    for (const step of Object.keys(STEP_WORDS) as Step[]) expect(STEP_WORDS[step].split(' ').length).toBeLessThanOrEqual(4);
  });
});

describe('firstSoundTimer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('ends once a sound has lasted 1 s, with no update in between, as a held slider squeeze sends none', () => {
    const done = vi.fn();
    const timer = firstSoundTimer(done);
    timer.update(true);
    vi.advanceTimersByTime(999);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledOnce();
  });

  it('starts over when the sound stops before 1 s', () => {
    const done = vi.fn();
    const timer = firstSoundTimer(done);
    timer.update(true);
    vi.advanceTimersByTime(900);
    timer.update(false);
    timer.update(true);
    vi.advanceTimersByTime(900);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(done).toHaveBeenCalledOnce();
  });

  it('counts from the first moment of sound, not from each update', () => {
    const done = vi.fn();
    const timer = firstSoundTimer(done);
    timer.update(true);
    vi.advanceTimersByTime(600);
    timer.update(true);
    vi.advanceTimersByTime(400);
    expect(done).toHaveBeenCalledOnce();
  });

  it('ends only once', () => {
    const done = vi.fn();
    const timer = firstSoundTimer(done);
    timer.update(true);
    vi.advanceTimersByTime(1000);
    timer.update(false);
    timer.update(true);
    vi.advanceTimersByTime(5000);
    expect(done).toHaveBeenCalledOnce();
  });
});
