import { describe, expect, it } from 'vitest';
import { drumWords } from '../src/ui/drumPanel';

describe('drumWords', () => {
  it('names the drum pattern and its tempo while the loop plays', () => {
    expect(drumWords({ playing: true, pattern: 0, layers: 4, muted: false })).toBe('Drums: Rock · 110 BPM');
  });

  it('names the drum pattern heard, which a new one replaces only from the next bar', () => {
    expect(drumWords({ playing: true, pattern: 1, layers: 4, muted: false }, { pattern: 0, layers: 4 })).toBe('Drums: Rock · 110 BPM');
    expect(drumWords({ playing: true, pattern: 1, layers: 4, muted: false }, { pattern: 1, layers: 4 })).toBe('Drums: House · 124 BPM');
  });

  it('adds "muted" while a closed fist mutes the loop', () => {
    expect(drumWords({ playing: true, pattern: 0, layers: 4, muted: true })).toBe('Drums: Rock · 110 BPM · muted');
  });

  it('says Drums off while the loop is stopped', () => {
    expect(drumWords({ playing: false, pattern: 0, layers: 4, muted: false })).toBe('Drums off');
  });
});
