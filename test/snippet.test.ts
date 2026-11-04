import { describe, expect, it } from 'vitest';
import type { SynthParams } from '../src/mapping/handToSynth';
import { PRESETS, reverbMix } from '../src/synth/presets';
import { gibberSnippet } from '../src/synth/snippet';

const byName = (name: string) => PRESETS.find((p) => p.name === name)!;
const SAW_LEAD = byName('Saw Lead');
const WARM_PAD = byName('Warm Pad');
const ORGAN = byName('Organ');
const BLUES_REED = byName('Blues Reed');
const params = (over: Partial<SynthParams>): SynthParams => ({ lane: 4, frequency: 392, cutoff: 1131, amp: 1, ampRampMs: 15, octave: 0, ...over });

interface Made {
  kind: string;
  props: Record<string, unknown>;
  connected: boolean;
}

const STOCK = ['Saw', 'Triangle', 'Square', 'PWM', 'Filter24Moog', 'Reverb', 'Delay'];
const SINGLE = ['saw', 'triangle', 'square', 'pwm', 'lpf', 'verb', 'echo'];
const VARIABLES = [...SINGLE, ...SINGLE.map((name) => name + '2')];

/** Runs a snippet against stand-ins for Gibber's stock objects and returns what it built, in order. */
function play(code: string, sampleRate = 48_000): Made[] {
  const made: Made[] = [];
  const stock = (kind: string) => (props: Record<string, unknown>) => {
    const ugen = { kind, props, connected: false, connect: () => ((ugen.connected = true), ugen) };
    made.push(ugen);
    return ugen;
  };
  // The snippet's own variables are parameters here, so running it leaves no globals behind.
  new Function(...STOCK, 'Gibberish', ...VARIABLES, code)(...STOCK.map(stock), { ctx: { sampleRate } });
  return made;
}

describe('gibberSnippet', () => {
  it('builds Saw Lead from stock calls: a sawtooth into the ladder filter into the reverb, to the speakers', () => {
    const [saw, lpf, verb, ...rest] = play(gibberSnippet([params({})], SAW_LEAD));
    expect(rest).toEqual([]);
    expect(saw).toMatchObject({ kind: 'Saw', props: { frequency: 392, gain: SAW_LEAD.gain }, connected: false });
    expect(lpf).toMatchObject({ kind: 'Filter24Moog', props: { input: saw, Q: SAW_LEAD.resonance }, connected: false });
    expect(verb).toMatchObject({ kind: 'Reverb', props: { input: lpf, ...reverbMix(0.3) }, connected: true });
  });

  it('builds every preset from its own oscillator, resonance, gain and effect', () => {
    const stockName = { saw: 'Saw', triangle: 'Triangle', square: 'Square', pwm: 'PWM' };
    for (const preset of PRESETS) {
      const [osc, lpf, fx, ...rest] = play(gibberSnippet([params({})], preset));
      expect(rest).toEqual([]);
      expect(osc).toMatchObject({ kind: stockName[preset.oscillator.shape], props: { frequency: 392, gain: preset.gain } });
      expect(lpf!.props).toMatchObject({ input: osc, Q: preset.resonance });
      const effect = preset.effect;
      if (effect.kind === 'reverb') {
        expect(fx).toMatchObject({ kind: 'Reverb', props: { input: lpf, ...reverbMix(effect.mix) }, connected: true });
      } else {
        expect(fx).toMatchObject({ kind: 'Delay', props: { input: lpf, time: effect.measures, feedback: effect.feedback, wetdry: effect.mix }, connected: true });
      }
    }
  });

  it('builds Warm Pad on a triangle wave and Organ on a square wave into a delay', () => {
    expect(play(gibberSnippet([params({})], WARM_PAD))[0]!.kind).toBe('Triangle');
    const [square, , echo] = play(gibberSnippet([params({})], ORGAN));
    expect([square!.kind, echo!.kind]).toEqual(['Square', 'Delay']);
  });

  it('gives the pulse wave its width, antialiased as in the app', () => {
    const shape = BLUES_REED.oscillator;
    if (shape.shape !== 'pwm') throw new Error('Blues Reed is a pulse wave');
    expect(play(gibberSnippet([params({})], BLUES_REED))[0]!.props).toMatchObject({ pulsewidth: shape.pulsewidth, antialias: true });
  });

  it('gives the cutoff in Hz over the playground’s Nyquist frequency, whatever its sample rate', () => {
    expect(play(gibberSnippet([params({ cutoff: 6400 })], SAW_LEAD), 48_000)[1]!.props.cutoff).toBeCloseTo(6400 / 24_000, 12);
    expect(play(gibberSnippet([params({ cutoff: 6400 })], SAW_LEAD), 44_100)[1]!.props.cutoff).toBeCloseTo(6400 / 22_050, 12);
  });

  it('sets the volume as the gain the app plays it at, to 3 decimals', () => {
    expect(play(gibberSnippet([params({ amp: 0.25 })], ORGAN))[0]!.props.gain).toBe(Math.round(0.25 * ORGAN.gain * 1000) / 1000);
  });

  it('rounds the note to 0.01 Hz and the cutoff to 1 Hz', () => {
    const [saw, lpf] = play(gibberSnippet([params({ frequency: 261.6255653, cutoff: 1131.37 })], SAW_LEAD), 44_100);
    expect(saw!.props.frequency).toBe(261.63);
    expect(lpf!.props.cutoff).toBe(1131 / 22_050);
  });

  it('names the preset, the note from the preset’s lanes, and the brightness in a comment', () => {
    expect(gibberSnippet([params({ frequency: SAW_LEAD.lanes[7]!.frequency, cutoff: 6400 })], SAW_LEAD).split('\n')[0]).toMatch(/^\/\/ .*Saw Lead.*D5.*6400 Hz/);
    expect(gibberSnippet([params({ lane: 3, frequency: ORGAN.lanes[3]!.frequency })], ORGAN).split('\n')[0]).toMatch(/^\/\/ .*Organ.*G4,/);
    expect(gibberSnippet([params({ lane: 3, frequency: BLUES_REED.lanes[3]!.frequency })], BLUES_REED).split('\n')[0]).toMatch(/E♭4,/);
  });

  it('plays silence while silent, with a comment line on how to raise the volume', () => {
    const code = gibberSnippet([params({ amp: 0 })], ORGAN);
    expect(play(code)[0]!.props.gain).toBe(0);
    expect(code.split('\n')).toContainEqual(expect.stringMatching(new RegExp(`^// .*square\\.gain = ${ORGAN.gain}$`)));
  });

  it('carries no volume hint while sound plays', () => {
    expect(gibberSnippet([params({ amp: 0.5 })], SAW_LEAD)).not.toContain('saw.gain =');
  });

  it('holds two voices while both hands sound: the second named with a 2, with its own filter and effect', () => {
    const lead = params({ lane: 7, frequency: 587.33, amp: 0.5 });
    const second = params({ lane: 1, frequency: 220, cutoff: 6400, amp: 1 });
    const code = gibberSnippet([lead, second], SAW_LEAD);
    const [saw, lpf, verb, saw2, lpf2, verb2, ...rest] = play(code);
    expect(rest).toEqual([]);
    expect(saw).toMatchObject({ kind: 'Saw', props: { frequency: lead.frequency, gain: 0.5 * SAW_LEAD.gain } });
    expect(verb).toMatchObject({ kind: 'Reverb', props: { input: lpf }, connected: true });
    expect(saw2).toMatchObject({ kind: 'Saw', props: { frequency: second.frequency, gain: SAW_LEAD.gain } });
    expect(lpf2).toMatchObject({ kind: 'Filter24Moog', props: { input: saw2, cutoff: 6400 / 24_000 } });
    expect(verb2).toMatchObject({ kind: 'Reverb', props: { input: lpf2, ...reverbMix(0.3) }, connected: true });
    expect(code).toMatch(/^saw2 = Saw\(/m);
    expect(code).toMatch(/^\/\/ Second hand: A3, brightness 6400 Hz, volume 100%$/m);
  });

  it('gives one sounding hand today’s single voice, whichever hand it is', () => {
    const silent = params({ amp: 0 });
    const playing = params({ amp: 0.8 });
    expect(gibberSnippet([silent, playing], SAW_LEAD)).toBe(gibberSnippet([playing], SAW_LEAD));
    expect(gibberSnippet([playing, silent], SAW_LEAD)).toBe(gibberSnippet([playing], SAW_LEAD));
  });

  it('shows the lead hand’s silent voice, with the line that makes it sound, while no hand sounds', () => {
    const lead = params({ amp: 0, frequency: ORGAN.lanes[2]!.frequency });
    const second = params({ amp: 0, frequency: ORGAN.lanes[5]!.frequency });
    expect(gibberSnippet([lead, second], ORGAN)).toBe(gibberSnippet([lead], ORGAN));
  });

  it('names the note in the octave being played, and plays it there', () => {
    const top = SAW_LEAD.lanes[7]!.frequency;
    const code = gibberSnippet([params({ lane: 7, frequency: top * 2, cutoff: 12_800, octave: 1 })], SAW_LEAD);
    expect(code.split('\n')[0]).toMatch(/Saw Lead: D6, brightness 12800 Hz/);
    expect(play(code)[0]!.props.frequency).toBe(Math.round(top * 2 * 100) / 100);
  });
});
