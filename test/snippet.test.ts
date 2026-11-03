import { describe, expect, it } from 'vitest';
import { NOTE_LANES, type SynthParams } from '../src/mapping/handToSynth';
import { gibberSnippet } from '../src/synth/snippet';

const params = (over: Partial<SynthParams>): SynthParams => ({ lane: 4, frequency: 392, cutoff: 1131, amp: 1, ampRampMs: 15, ...over });

interface Made {
  kind: string;
  props: Record<string, unknown>;
  connected: boolean;
}

/** Runs a snippet against stand-ins for Gibber's stock objects and returns what it built, in order. */
function play(code: string, sampleRate = 48_000): Made[] {
  const made: Made[] = [];
  const stock = (kind: string) => (props: Record<string, unknown>) => {
    const ugen = { kind, props, connected: false, connect: () => ((ugen.connected = true), ugen) };
    made.push(ugen);
    return ugen;
  };
  const names = ['Saw', 'Filter24Moog', 'Reverb'];
  // The snippet's own variables are parameters here, so running it leaves no globals behind.
  new Function(...names, 'Gibberish', 'saw', 'lpf', 'verb', code)(...names.map(stock), { ctx: { sampleRate } });
  return made;
}

describe('gibberSnippet', () => {
  it('builds the sound from stock calls: a sawtooth into the ladder filter into the reverb, to the speakers', () => {
    const [saw, lpf, verb, ...rest] = play(gibberSnippet(params({})));
    expect(rest).toEqual([]);
    expect(saw).toMatchObject({ kind: 'Saw', props: { frequency: 392, gain: 1.4 }, connected: false });
    expect(lpf).toMatchObject({ kind: 'Filter24Moog', props: { input: saw, Q: 0.5 }, connected: false });
    expect(verb).toMatchObject({ kind: 'Reverb', props: { input: lpf, wet1: 0.3, wet2: 0, dry: 0.7 }, connected: true });
  });

  it('gives the cutoff in Hz over the playground’s Nyquist frequency, whatever its sample rate', () => {
    expect(play(gibberSnippet(params({ cutoff: 6400 })), 48_000)[1]!.props.cutoff).toBeCloseTo(6400 / 24_000, 12);
    expect(play(gibberSnippet(params({ cutoff: 6400 })), 44_100)[1]!.props.cutoff).toBeCloseTo(6400 / 22_050, 12);
  });

  it('sets the volume as the gain the app plays it at', () => {
    expect(play(gibberSnippet(params({ amp: 0.25 })))[0]!.props.gain).toBeCloseTo(0.35, 12);
  });

  it('rounds the note to 0.01 Hz and the cutoff to 1 Hz', () => {
    const [saw, lpf] = play(gibberSnippet(params({ frequency: 261.6255653, cutoff: 1131.37 })), 44_100);
    expect(saw!.props.frequency).toBe(261.63);
    expect(lpf!.props.cutoff).toBe(1131 / 22_050);
  });

  it('names the note and the brightness in a comment', () => {
    expect(gibberSnippet(params({ frequency: NOTE_LANES[7]!.frequency, cutoff: 6400 })).split('\n')[0]).toMatch(/^\/\/ .*D5.*6400 Hz/);
  });

  it('plays silence while silent, with a comment line on how to raise the volume', () => {
    const code = gibberSnippet(params({ amp: 0 }));
    expect(play(code)[0]!.props.gain).toBe(0);
    expect(code.split('\n')).toContainEqual(expect.stringMatching(/^\/\/ .*saw\.gain = 1\.4/));
  });

  it('carries no volume hint while sound plays', () => {
    expect(gibberSnippet(params({ amp: 0.5 }))).not.toContain('saw.gain =');
  });
});
