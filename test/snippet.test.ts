import { describe, expect, it } from 'vitest';
import type { SynthParams } from '../src/mapping/handToSynth';
import { DRUM_PATTERNS, KIT, drumSteps, type Drum, type DrumLayers, type Drums } from '../src/synth/drumPatterns';
import { PRESETS, reverbMix, type Preset } from '../src/synth/presets';
import { gibberSnippet } from '../src/synth/snippet';

const byName = (name: string) => PRESETS.find((p) => p.name === name)!;
const SAW_LEAD = byName('Saw Lead');
const WARM_PAD = byName('Warm Pad');
const ORGAN = byName('Organ');
const DEEP_BASS = byName('Deep Bass');
const BLUES_REED = byName('Blues Reed');
const params = (over: Partial<SynthParams>): SynthParams => ({ lane: 4, frequency: 392, cutoff: 1131, amp: 1, ampRampMs: 15, octave: 0, ...over });
/** The snippet at the preset's own effect amount, unless another is given, without drums unless given. */
const snippet = (sounds: SynthParams[], preset: Preset, effect = preset.effect.mix, drums: Drums | null = null) =>
  gibberSnippet(sounds, preset, effect, drums);

interface Made {
  kind: string;
  props: Record<string, unknown>;
  connected: boolean;
}

/** A stock drum: what `trigger.seq` was given, the loudness values and the Hex string of the steps it hits. */
interface Drummed extends Made {
  seq?: { values: number | number[]; hits: string };
}

const STOCK = ['Saw', 'Triangle', 'Square', 'PWM', 'Filter24Moog', 'Reverb', 'Delay', 'Kick', 'Snare', 'Hat'];
const SINGLE = ['saw', 'triangle', 'square', 'pwm', 'lpf', 'verb', 'echo'];
const DRUMS = ['kick', 'snare', 'hat', 'openHat'];
const VARIABLES = [...SINGLE, ...SINGLE.map((name) => name + '2'), ...DRUMS];

/**
 * Runs a snippet against stand-ins for Gibber's stock objects. Returns what it built, in order, setting
 * the clock's tempo included, and its drums by variable name.
 */
function run(code: string, sampleRate = 48_000): { made: Drummed[]; drums: Record<string, Drummed | undefined> } {
  const made: Drummed[] = [];
  const stock = (kind: string) => (props: Record<string, unknown>) => {
    const ugen: Drummed & { connect(): Drummed; trigger: { seq(values: number | number[], hits: { hex: string }): void } } = {
      kind,
      props,
      connected: false,
      connect: () => ((ugen.connected = true), ugen),
      trigger: { seq: (values, hits) => (ugen.seq = { values, hits: hits.hex }) }
    };
    made.push(ugen);
    return ugen;
  };
  const Clock = { set bpm(bpm: number) { made.push({ kind: 'Clock.bpm', props: { bpm }, connected: false }); } };
  const Hex = (hex: string) => ({ hex });
  // The snippet's own variables are parameters here, so running it leaves no globals behind.
  const drums = new Function(...STOCK, 'Clock', 'Hex', 'Gibberish', ...VARIABLES, `${code}\nreturn { ${DRUMS.join(', ')} }`)(
    ...STOCK.map(stock),
    Clock,
    Hex,
    { ctx: { sampleRate } }
  ) as Record<string, Drummed | undefined>;
  return { made, drums };
}

/** Runs a snippet as run() does and returns what it built, in order. */
function play(code: string, sampleRate = 48_000): Made[] {
  return run(code, sampleRate).made;
}

/** Each of the 16 steps' loudness a stock drum's sequence plays, 0 where it rests: Gibber reads the next value as the drum hits. */
function stepsOf(drum: Drummed): number[] {
  const { values, hits } = drum.seq!;
  const bits = [...hits].flatMap((digit) => [...parseInt(digit, 16).toString(2).padStart(4, '0')]);
  let hit = 0;
  return bits.map((bit) => (bit === '1' ? (Array.isArray(values) ? values[hit++ % values.length]! : values) : 0));
}

/** Each drum's loudness on each of the 16 steps, 0 where it rests, as the app plays the drum pattern at `layers`. */
function appSteps(pattern: number, layers: DrumLayers): Partial<Record<Drum, number[]>> {
  const steps: Partial<Record<Drum, number[]>> = {};
  drumSteps(DRUM_PATTERNS[pattern]!, layers).forEach((hits, step) => {
    for (const { drum, loudness } of hits) (steps[drum] ??= Array<number>(16).fill(0))[step] = loudness;
  });
  return steps;
}

describe('gibberSnippet', () => {
  it('builds Saw Lead from stock calls: a sawtooth into the ladder filter into the reverb, to the speakers', () => {
    const [saw, lpf, verb, ...rest] = play(snippet([params({})], SAW_LEAD));
    expect(rest).toEqual([]);
    expect(saw).toMatchObject({ kind: 'Saw', props: { frequency: 392, gain: SAW_LEAD.gain }, connected: false });
    expect(lpf).toMatchObject({ kind: 'Filter24Moog', props: { input: saw, Q: SAW_LEAD.resonance }, connected: false });
    expect(verb).toMatchObject({ kind: 'Reverb', props: { input: lpf, ...reverbMix(0.3) }, connected: true });
  });

  it('builds every preset from its own oscillator, resonance, gain and effect', () => {
    const stockName = { saw: 'Saw', triangle: 'Triangle', square: 'Square', pwm: 'PWM' };
    for (const preset of PRESETS) {
      const [osc, lpf, fx, ...rest] = play(snippet([params({})], preset));
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
    expect(play(snippet([params({})], WARM_PAD))[0]!.kind).toBe('Triangle');
    const [square, , echo] = play(snippet([params({})], ORGAN));
    expect([square!.kind, echo!.kind]).toEqual(['Square', 'Delay']);
  });

  it('gives the pulse wave its width, antialiased as in the app', () => {
    const shape = BLUES_REED.oscillator;
    if (shape.shape !== 'pwm') throw new Error('Blues Reed is a pulse wave');
    expect(play(snippet([params({})], BLUES_REED))[0]!.props).toMatchObject({ pulsewidth: shape.pulsewidth, antialias: true });
  });

  it('gives the cutoff in Hz over the playground’s Nyquist frequency, whatever its sample rate', () => {
    expect(play(snippet([params({ cutoff: 6400 })], SAW_LEAD), 48_000)[1]!.props.cutoff).toBeCloseTo(6400 / 24_000, 12);
    expect(play(snippet([params({ cutoff: 6400 })], SAW_LEAD), 44_100)[1]!.props.cutoff).toBeCloseTo(6400 / 22_050, 12);
  });

  it('sets the volume as the gain the app plays it at, to 3 decimals', () => {
    expect(play(snippet([params({ amp: 0.25 })], ORGAN))[0]!.props.gain).toBe(Math.round(0.25 * ORGAN.gain * 1000) / 1000);
  });

  it('rounds the note to 0.01 Hz and the cutoff to 1 Hz', () => {
    const [saw, lpf] = play(snippet([params({ frequency: 261.6255653, cutoff: 1131.37 })], SAW_LEAD), 44_100);
    expect(saw!.props.frequency).toBe(261.63);
    expect(lpf!.props.cutoff).toBe(1131 / 22_050);
  });

  it('names the preset, the note from the preset’s lanes, and the brightness in a comment', () => {
    expect(snippet([params({ frequency: SAW_LEAD.lanes[7]!.frequency, cutoff: 6400 })], SAW_LEAD).split('\n')[0]).toMatch(/^\/\/ .*Saw Lead.*D5.*6400 Hz/);
    expect(snippet([params({ lane: 3, frequency: ORGAN.lanes[3]!.frequency })], ORGAN).split('\n')[0]).toMatch(/^\/\/ .*Organ.*G4,/);
    expect(snippet([params({ lane: 3, frequency: BLUES_REED.lanes[3]!.frequency })], BLUES_REED).split('\n')[0]).toMatch(/E♭4,/);
  });

  it('plays silence while silent, with a comment line on how to raise the volume', () => {
    const code = snippet([params({ amp: 0 })], ORGAN);
    expect(play(code)[0]!.props.gain).toBe(0);
    expect(code.split('\n')).toContainEqual(expect.stringMatching(new RegExp(`^// .*square\\.gain = ${ORGAN.gain}$`)));
  });

  it('carries no volume hint while sound plays', () => {
    expect(snippet([params({ amp: 0.5 })], SAW_LEAD)).not.toContain('saw.gain =');
  });

  it('holds two voices while both hands sound: the second named with a 2, with its own filter and effect', () => {
    const lead = params({ lane: 7, frequency: 587.33, amp: 0.5 });
    const second = params({ lane: 1, frequency: 220, cutoff: 6400, amp: 1 });
    const code = snippet([lead, second], SAW_LEAD);
    const [saw, lpf, verb, saw2, lpf2, verb2, ...rest] = play(code);
    expect(rest).toEqual([]);
    expect(saw).toMatchObject({ kind: 'Saw', props: { frequency: lead.frequency, gain: 0.5 * SAW_LEAD.gain } });
    expect(verb).toMatchObject({ kind: 'Reverb', props: { input: lpf }, connected: true });
    expect(saw2).toMatchObject({ kind: 'Saw', props: { frequency: second.frequency, gain: SAW_LEAD.gain } });
    expect(lpf2).toMatchObject({ kind: 'Filter24Moog', props: { input: saw2, cutoff: 6400 / 24_000 } });
    expect(verb2).toMatchObject({ kind: 'Reverb', props: { input: lpf2, ...reverbMix(0.3) }, connected: true });
    expect(code).toMatch(/^saw2 = Saw\(/m);
    expect(code).toMatch(/^\/\/ Second hand: A3, brightness 6400 Hz, volume 100%, reverb 30%$/m);
  });

  it('gives one sounding hand today’s single voice, whichever hand it is', () => {
    const silent = params({ amp: 0 });
    const playing = params({ amp: 0.8 });
    expect(snippet([silent, playing], SAW_LEAD)).toBe(snippet([playing], SAW_LEAD));
    expect(snippet([playing, silent], SAW_LEAD)).toBe(snippet([playing], SAW_LEAD));
  });

  it('shows the lead hand’s silent voice, with the line that makes it sound, while no hand sounds', () => {
    const lead = params({ amp: 0, frequency: ORGAN.lanes[2]!.frequency });
    const second = params({ amp: 0, frequency: ORGAN.lanes[5]!.frequency });
    expect(snippet([lead, second], ORGAN)).toBe(snippet([lead], ORGAN));
  });

  it('sets the reverb to the effect amount, to 3 decimals, and names it in the comment', () => {
    const code = snippet([params({})], SAW_LEAD, 0.4523);
    expect(play(code)[2]!.props).toMatchObject({ wet1: 0.452, wet2: 0, dry: 0.548 });
    expect(code.split('\n')[0]).toMatch(/, reverb 45%$/);
    expect(snippet([params({})], WARM_PAD, 0.8)).toContain('wet1: 0.8, wet2: 0, dry: 0.2 })');
  });

  it('sets the echo to the effect amount, in every voice', () => {
    const code = snippet([params({ amp: 1 }), params({ amp: 0.5 })], ORGAN, 0.45);
    const [, , echo, , , echo2] = play(code);
    expect([echo!.props.wetdry, echo2!.props.wetdry]).toEqual([0.45, 0.45]);
    expect(code).toMatch(/^\/\/ Second hand: .*, echo 45%$/m);
  });

  it('names the note in the lowered octave, and plays it there', () => {
    const lowest = DEEP_BASS.lanes[0]!.frequency;
    const code = snippet([params({ lane: 0, frequency: lowest / 2, cutoff: 100, octave: -1 })], DEEP_BASS);
    expect(code.split('\n')[0]).toMatch(/Deep Bass: E1, brightness 100 Hz/);
    expect(play(code)[0]!.props.frequency).toBe(Math.round((lowest / 2) * 100) / 100);
  });

  it('names the note in the octave being played, and plays it there', () => {
    const top = SAW_LEAD.lanes[7]!.frequency;
    const code = snippet([params({ lane: 7, frequency: top * 2, cutoff: 12_800, octave: 1 })], SAW_LEAD);
    expect(code.split('\n')[0]).toMatch(/Saw Lead: D6, brightness 12800 Hz/);
    expect(play(code)[0]!.props.frequency).toBe(Math.round(top * 2 * 100) / 100);
  });
});

describe('gibberSnippet drums', () => {
  const note = params({});
  const loop = (pattern: number, layers: DrumLayers): Drums => ({ pattern, layers });
  const playedDrums = (drums: Record<string, Drummed | undefined>) => Object.keys(drums).filter((name) => drums[name]);

  it('plays Hip-hop at 2 drum layers as kick and snare at 90 BPM, then the notes over it', () => {
    const code = snippet([note], SAW_LEAD, 0.3, loop(2, 2));
    const { made, drums } = run(code);
    expect(made[0]).toMatchObject({ kind: 'Clock.bpm', props: { bpm: 90 } });
    expect(playedDrums(drums)).toEqual(['kick', 'snare']);
    expect(stepsOf(drums.kick!)).toEqual([1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0]);
    expect(stepsOf(drums.snare!)).toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]);
    expect(made.slice(-3).map((m) => m.kind)).toEqual(['Saw', 'Filter24Moog', 'Reverb']);
    expect(code.split('\n')[0]).toBe('// Drums: Hip-hop, 90 BPM, 2 of 4 drum layers');
  });

  it('plays every drum pattern at every count of drum layers hit for hit, loudness included, as the app', () => {
    for (const pattern of [0, 1, 2, 3]) {
      for (const layers of [1, 2, 3, 4] as const) {
        const { made, drums } = run(snippet([note], SAW_LEAD, 0.3, loop(pattern, layers)));
        expect(made[0]!.props.bpm).toBe(DRUM_PATTERNS[pattern]!.bpm);
        const app = appSteps(pattern, layers);
        expect(playedDrums(drums)).toEqual(Object.keys(KIT).filter((drum) => app[drum as Drum]));
        for (const drum of playedDrums(drums)) expect(stepsOf(drums[drum]!)).toEqual(app[drum as Drum]);
      }
    }
  });

  it('builds each drum from its stock instrument with every setting of the app’s kit, to the speakers', () => {
    const { drums } = run(snippet([note], SAW_LEAD, 0.3, loop(1, 4)));
    for (const drum of ['kick', 'snare', 'hat', 'openHat'] as const) {
      expect(drums[drum]).toMatchObject({ kind: KIT[drum].instrument, connected: true });
      expect(drums[drum]!.props).toEqual(KIT[drum].settings);
    }
  });

  it('builds every drum before it starts any, so building one never delays another’s start', () => {
    const lines = snippet([note], SAW_LEAD, 0.3, loop(1, 4)).split('\n');
    const built = lines.flatMap((line, i) => (/^\w+ = (Kick|Snare|Hat)\(/.test(line) ? [i] : []));
    const started = lines.flatMap((line, i) => (line.includes('.trigger.seq(') ? [i] : []));
    expect([built.length, started.length]).toEqual([4, 4]);
    expect(Math.max(...built)).toBeLessThan(Math.min(...started));
  });

  it('sets the tempo before the echo is built, so the pasted echo keeps the app’s timing', () => {
    const kinds = play(snippet([note], ORGAN, 0.45, loop(0, 4))).map((m) => m.kind);
    expect(kinds.slice(0, kinds.indexOf('Delay'))).toContain('Clock.bpm');
  });

  it('leaves the drums and the tempo out while no drum loop plays', () => {
    const code = snippet([note], ORGAN, 0.45, null);
    expect(code).not.toMatch(/Clock|Kick|Snare|Hat/);
    expect(play(code).map((m) => m.kind)).toEqual(['Square', 'Filter24Moog', 'Delay']);
  });
});
