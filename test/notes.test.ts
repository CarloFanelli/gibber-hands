import { describe, expect, it } from 'vitest';
import { noteFrequency, raiseOctave } from '../src/mapping/notes';

describe('noteFrequency', () => {
  it('tunes A4 to 440 Hz and the other notes in equal temperament', () => {
    expect(noteFrequency('A4')).toBe(440);
    expect(noteFrequency('A3')).toBeCloseTo(220, 10);
    expect(noteFrequency('C4')).toBeCloseTo(261.626, 3);
    expect(noteFrequency('G4')).toBeCloseTo(391.995, 3);
    expect(noteFrequency('D5')).toBeCloseTo(587.33, 2);
    expect(noteFrequency('E2')).toBeCloseTo(82.407, 3);
  });

  it('lowers a flat by one semitone', () => {
    expect(noteFrequency('B♭3')).toBeCloseTo(233.082, 3);
    expect(noteFrequency('E♭4')).toBeCloseTo(311.127, 3);
  });

  it('rejects what is not a note name', () => {
    for (const name of ['H4', 'A', 'Bb3', 'C#4', 'a4', '']) expect(() => noteFrequency(name)).toThrow();
  });
});

describe('raiseOctave', () => {
  it('names the same note octaves up', () => {
    expect(raiseOctave('B♭3', 1)).toBe('B♭4');
    expect(raiseOctave('D5', 1)).toBe('D6');
    expect(raiseOctave('E2', 0)).toBe('E2');
  });
});
