import { describe, expect, it } from 'vitest';
import type { DrumLoop } from '../src/mapping/drumLoop';
import { drumControls, drumWords } from '../src/ui/drumPanel';

describe('drumWords', () => {
  it('names the drum pattern, its tempo and the drum layers while the loop plays', () => {
    expect(drumWords({ playing: true, pattern: 0, layers: 4 })).toBe('Drums: Rock · 110 BPM · layers 4/4');
  });

  it('names a drum pattern as soon as it is chosen, though it is heard from the next bar', () => {
    expect(drumWords({ playing: true, pattern: 1, layers: 3 })).toBe('Drums: House · 124 BPM · layers 3/4');
  });

  it('says Drums off while the loop is stopped, with the choice the next start plays', () => {
    expect(drumWords({ playing: false, pattern: 2, layers: 2 })).toBe('Drums off · Hip-hop · 90 BPM · layers 2/4');
  });
});

describe('drumControls', () => {
  const loop = (over: Partial<DrumLoop> = {}): DrumLoop => ({ playing: true, pattern: 1, layers: 3, ...over });
  const on = { kind: 'on' } as const;

  it('reads Stop drums while the loop plays, and Start drums while it is stopped', () => {
    expect(drumControls(loop(), on).label).toBe('Stop drums');
    expect(drumControls(loop({ playing: false }), on).label).toBe('Start drums');
  });

  it('lets every drum button be pressed, with or without audio, the loop playing or stopped', () => {
    const none = { toggle: false, previous: false, next: false, fewer: false, more: false };
    for (const kind of ['off', 'starting', 'on'] as const) {
      expect(drumControls(loop(), { kind }).disabled).toEqual(none);
      expect(drumControls(loop({ playing: false }), { kind }).disabled).toEqual(none);
    }
  });

  it('cannot remove a drum layer at 1, nor add one at 4', () => {
    expect(drumControls(loop({ layers: 1 }), on).disabled).toMatchObject({ fewer: true, more: false });
    expect(drumControls(loop({ layers: 4 }), on).disabled).toMatchObject({ fewer: false, more: true });
  });

  it('disables every drum button once the audio engine has failed', () => {
    const failed = drumControls(loop({ playing: false }), { kind: 'failed', failure: { reason: 'network' } });
    expect(failed.disabled).toEqual({ toggle: true, previous: true, next: true, fewer: true, more: true });
  });
});
