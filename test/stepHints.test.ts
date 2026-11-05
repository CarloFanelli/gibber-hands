import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIRST_SOUND_MS, SHAPE_HINT_MS, STEP_WORDS, holdTimer, nextStep, stepToShow, stepWords, type Progress, type Step } from '../src/ui/stepHints';

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
    const steps = [...Object.keys(STEP_WORDS), 'shape'] as Step[];
    for (const step of steps) for (const side of ['left', 'right'] as const) expect(stepWords(step, side).split(' ').length).toBeLessThanOrEqual(4);
  });
});

describe('stepToShow', () => {
  const live: Progress = { camera: 'live', hand: true, audio: true };

  it('shows the first step not done until a first sound has lasted a second', () => {
    expect(stepToShow(live, { firstSound: false, shape: false })).toBe('squeeze');
    expect(stepToShow({ ...live, hand: false }, { firstSound: false, shape: false })).toBe('hand');
  });

  it('then teaches the second hand’s switch while a hand is in view, not while the hand model loads', () => {
    expect(stepToShow(live, { firstSound: true, shape: false })).toBe('shape');
    expect(stepToShow({ ...live, hand: false }, { firstSound: true, shape: false })).toBeNull();
  });

  it('shows nothing more once the second hand has switched, or the shape hint has had its time', () => {
    expect(stepToShow(live, { firstSound: true, shape: true })).toBeNull();
  });

  it('never teaches the switch on the sliders, or without the camera running', () => {
    expect(stepToShow({ ...live, camera: 'sliders' }, { firstSound: true, shape: false })).toBeNull();
    expect(stepToShow({ ...live, camera: 'waiting' }, { firstSound: true, shape: false })).toBeNull();
  });
});

describe('stepWords', () => {
  it('names the second hand by its side', () => {
    expect(stepWords('shape', 'left')).toBe('Left hand: shape sound');
    expect(stepWords('shape', 'right')).toBe('Right hand: shape sound');
  });

  it('says the other steps whichever hand leads', () => {
    expect(stepWords('squeeze', 'left')).toBe('Squeeze to play');
    expect(stepWords('squeeze', 'right')).toBe('Squeeze to play');
  });
});

describe('holdTimer', () => {
  const firstSoundTimer = (done: () => void) => holdTimer(FIRST_SOUND_MS, done);

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

  it('hides the shape hint after 10 s', () => {
    expect(SHAPE_HINT_MS).toBe(10_000);
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
