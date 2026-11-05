import { describe, expect, it } from 'vitest';
import { noteFrequency } from '../src/mapping/notes';
import { LANES } from '../src/mapping/handToSynth';
import { GIBBER_BPM, PRESETS, delaySamples, presetIndex, reverbMix } from '../src/synth/presets';

describe('PRESETS', () => {
  it('lists the six presets in number-key order, each with its character and scale', () => {
    expect(PRESETS.map((p) => [p.name, p.character, p.scale])).toEqual([
      ['Saw Lead', 'bright sawtooth lead', 'A minor pentatonic'],
      ['Warm Pad', 'soft, slow string pad', 'C major pentatonic'],
      ['Organ', 'hollow square-wave organ', 'D dorian'],
      ['Deep Bass', 'round low bass', 'E minor pentatonic'],
      ['Brass', 'brassy synth horn', 'F major'],
      ['Blues Reed', 'nasal reedy lead', 'A blues']
    ]);
  });

  it('plays each scale across the note lanes, left to right, carrying it on above the eighth lane', () => {
    expect(PRESETS.map((p) => p.lanes.map((n) => n.name).join(' '))).toEqual([
      'A3 C4 D4 E4 G4 A4 C5 D5 E5 G5 A5 C6 D6 E6 G6 A6',
      'C4 D4 E4 G4 A4 C5 D5 E5 G5 A5 C6 D6 E6 G6 A6 C7',
      'D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5 A5 B5 C6 D6 E6',
      'E2 G2 A2 B2 D3 E3 G3 A3 B3 D4 E4 G4 A4 B4 D5 E5',
      'F3 G3 A3 B♭3 C4 D4 E4 F4 G4 A4 B♭4 C5 D5 E5 F5 G5',
      'A3 C4 D4 E♭4 E4 G4 A4 C5 D5 E♭5 E5 G5 A5 C6 D6 E♭6'
    ]);
    for (const p of PRESETS) {
      expect(p.lanes).toHaveLength(LANES.max);
      for (const n of p.lanes) expect(n.frequency).toBe(noteFrequency(n.name));
    }
  });

  it('gives each preset its effect type and mix', () => {
    expect(PRESETS.map((p) => [p.effect.kind, p.effect.mix])).toEqual([
      ['reverb', 0.3],
      ['reverb', 0.6],
      ['delay', 0.25],
      ['reverb', 0.1],
      ['reverb', 0.25],
      ['delay', 0.3]
    ]);
  });

  it('builds each sound from one stock oscillator', () => {
    for (const p of PRESETS) expect(['saw', 'triangle', 'square', 'pwm']).toContain(p.oscillator.shape);
    expect(PRESETS[0]!.oscillator.shape).toBe('saw');
    expect(PRESETS[2]!.oscillator.shape).toBe('square');
  });

  it('saves each preset under its own name', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
  });
});

describe('presetIndex', () => {
  it('finds the saved preset', () => {
    PRESETS.forEach((p, i) => expect(presetIndex(p.id)).toBe(i));
  });

  it('starts on Saw Lead when nothing is saved, or the saved preset no longer exists', () => {
    expect(presetIndex(null)).toBe(0);
    expect(presetIndex('warm-pad-v0')).toBe(0);
    expect(presetIndex('')).toBe(0);
  });
});

describe('reverbMix', () => {
  it('sends the mix to the reverb and keeps the rest dry, on the same channel', () => {
    expect(reverbMix(0.3)).toEqual({ wet1: 0.3, wet2: 0, dry: 0.7 });
    expect(reverbMix(0.6)).toEqual({ wet1: 0.6, wet2: 0, dry: 0.4 });
  });
});

describe('delaySamples', () => {
  it('converts a delay time in measures as Gibber does, at its 140 BPM in 4/4', () => {
    // An eighth of a measure is half a beat: 30/140 s.
    expect(GIBBER_BPM).toBe(140);
    expect(delaySamples(1 / 8, GIBBER_BPM, 48_000)).toBeCloseTo((30 / 140) * 48_000, 6);
    expect(delaySamples(1, GIBBER_BPM, 44_100)).toBeCloseTo((240 / 140) * 44_100, 6);
  });

  it('keeps the delay time in beats at another tempo', () => {
    expect(delaySamples(1 / 8, 110, 48_000)).toBeCloseTo((30 / 110) * 48_000, 6);
    expect(delaySamples(3 / 16, 110, 48_000)).toBeCloseTo((45 / 110) * 48_000, 6);
  });
});
