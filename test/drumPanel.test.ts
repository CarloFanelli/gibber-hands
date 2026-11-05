import { describe, expect, it } from 'vitest';
import { drumWords } from '../src/ui/drumPanel';

describe('drumWords', () => {
  it('names the drum pattern and its tempo while the loop plays', () => {
    expect(drumWords({ playing: true, pattern: 0, layers: 4 })).toBe('Drums: Rock · 110 BPM');
  });

  it('says Drums off while the loop is stopped', () => {
    expect(drumWords({ playing: false, pattern: 0, layers: 4 })).toBe('Drums off');
  });
});
