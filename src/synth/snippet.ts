/**
 * The live code: Gibber code that plays the sound the hand asks for, to paste into the gibber.cc
 * playground. Pure, so it is shown before "Start audio", with the sliders, and in tests.
 *
 * It rebuilds the engine's chain for the current preset from Gibber's stock objects: the same oscillator
 * into the same ladder filter, then the same reverb or delay. Not the stock Synth: its envelope also
 * scales the volume and the cutoff. The volume becomes the oscillator's gain. Everything after it is
 * linear, so the level matches the app, which applies it after the effect. Each sounding hand has its own
 * chain, as in the app. The effect's own mix gives the reverb or echo amount the app splits around it.
 *
 * While the drum loop plays, the snippet first sets Gibber's tempo to its drum pattern's, then plays the
 * drums on Gibber's stock kick, snare and hi-hats with the app's kit settings, from the same steps.
 */
import type { SynthParams } from '../mapping/handToSynth';
import { raiseOctave } from '../mapping/notes';
import { DRUM_PATTERNS, KIT, STEPS, drumSteps, type Drum, type Drums } from './drumPatterns';
import { EFFECT_NAME, reverbMix, type Oscillator, type Preset } from './presets';

/** Gibber's constructor for each oscillator shape; the snippet names its variable after the shape. */
const STOCK_OSCILLATOR: Record<Oscillator['shape'], string> = { saw: 'Saw', triangle: 'Triangle', square: 'Square', pwm: 'PWM' };
/** Every stock Gibber constructor a snippet can call. */
export const STOCK_NAMES: readonly string[] = [
  ...Object.values(STOCK_OSCILLATOR),
  'Filter24Moog',
  'Reverb',
  'Delay',
  ...new Set(Object.values(KIT).map((drum) => drum.instrument)),
  'Hex'
];

/**
 * `sounds` are the hands' sounds, the lead hand's first. Every sounding hand gets its own voice, the second
 * one's names ending in 2; while no hand sounds, the lead hand's voice is shown silent. `effect` is the
 * reverb or echo amount, 0..1, for every voice. `drums` is the drum loop heard, null while none sounds.
 */
export function gibberSnippet(sounds: readonly SynthParams[], preset: Preset, effect: number, drums: Drums | null): string {
  const sounding = sounds.filter((p) => gainOf(p, preset) > 0);
  const voices = sounding.length > 0 ? sounding : sounds.slice(0, 1);
  const mix = round(effect, 3);
  // The tempo comes before the echo is built: Gibber reads its time in measures at that tempo.
  return [...(drums ? [drumCode(drums)] : []), ...voices.map((p, i) => voiceCode(p, preset, i, mix))].join('\n');
}

/** The tempo, then each drum in play on its stock instrument, sequenced on sixteenths. */
function drumCode({ pattern, layers }: Drums): string {
  const drumPattern = DRUM_PATTERNS[pattern]!;
  const { name, bpm } = drumPattern;
  const lines = [`// Drums: ${name}, ${bpm} BPM, ${layers} of 4 drum layers`, `Clock.bpm = ${bpm}`];
  const steps = new Map<Drum, number[]>();
  drumSteps(drumPattern, layers).forEach((hits, step) => {
    for (const { drum, loudness } of hits) {
      if (!steps.has(drum)) steps.set(drum, Array<number>(STEPS).fill(0));
      steps.get(drum)![step] = loudness;
    }
  });
  const kit = (Object.keys(KIT) as Drum[]).filter((drum) => steps.has(drum));
  // Every drum is built before any starts: a drum built between two starts delays the second by a few
  // audio blocks, a flam.
  for (const drum of kit) lines.push(`${drum} = ${KIT[drum].instrument}({ ${settings(KIT[drum].settings)} }).connect()`);
  // Hex marks the steps a drum hits, 4 to a digit; the values give their loudness.
  for (const drum of kit) lines.push(`${drum}.trigger.seq(${loudnessValues(steps.get(drum)!)}, Hex('${hexSteps(steps.get(drum)!)}'))`);
  return lines.join('\n');
}

/**
 * A drum's loudness values for Gibber, from each step's, 0 where it rests. Gibber reads the next value only
 * when the drum hits, so they are its hits' loudness in bar order, cut to the shortest run that repeats over
 * the bar: often one number.
 */
function loudnessValues(loudness: readonly number[]): string {
  const hits = loudness.filter((l) => l > 0);
  const length = hits.findIndex((_, i) => hits.length % (i + 1) === 0 && hits.every((l, j) => l === hits[j % (i + 1)])) + 1;
  return length === 1 ? String(hits[0]) : `[${hits.slice(0, length).join(', ')}]`;
}

/** The steps a drum hits as Gibber's Hex string: each digit holds 4 steps, the first as its highest bit. */
function hexSteps(loudness: readonly number[]): string {
  let hex = '';
  for (let step = 0; step < loudness.length; step += 4) {
    hex += loudness.slice(step, step + 4).reduce((digit, l) => digit * 2 + (l > 0 ? 1 : 0), 0).toString(16);
  }
  return hex;
}

function voiceCode(p: SynthParams, preset: Preset, index: number, mix: number): string {
  const frequency = round(p.frequency, 2);
  const cutoff = Math.round(p.cutoff);
  const gain = gainOf(p, preset);
  const lane = preset.lanes.find((n) => n.frequency === p.frequency / 2 ** p.octave);
  const note = lane ? raiseOctave(lane.name, p.octave) : `${frequency} Hz`;
  const suffix = index === 0 ? '' : String(index + 1);
  const shape = preset.oscillator.shape + suffix;
  const [lpf, verb, echo] = ['lpf', 'verb', 'echo'].map((name) => name + suffix);
  // The app antialiases only the pulse wave: Gibber's plain one swings 0..1, and its offset would thump.
  const pulse = preset.oscillator.shape === 'pwm' ? `, pulsewidth: ${preset.oscillator.pulsewidth}, antialias: true` : '';
  const effect = preset.effect;
  const heading = index === 0 ? `gibber-hands, ${preset.name}` : 'Second hand';
  const amount = `${EFFECT_NAME[effect.kind].toLowerCase()} ${Math.round(mix * 100)}%`;
  return [
    `// ${heading}: ${note}, brightness ${cutoff} Hz, volume ${Math.round(p.amp * 100)}%, ${amount}`,
    ...(gain === 0 ? [`// Silent right now. To hear it, run: ${shape}.gain = ${preset.gain}`] : []),
    `${shape} = ${STOCK_OSCILLATOR[preset.oscillator.shape]}({ frequency: ${frequency}, gain: ${gain}${pulse} })`,
    // The ladder filter takes its cutoff as a fraction of the Nyquist frequency.
    `${lpf} = Filter24Moog({ input: ${shape}, Q: ${preset.resonance}, cutoff: ${cutoff} / (Gibberish.ctx.sampleRate / 2) })`,
    effect.kind === 'reverb'
      ? `${verb} = Reverb({ input: ${lpf}, ${settings(reverbMix(mix))} }).connect()`
      : // Gibber reads the time in measures.
        `${echo} = Delay({ input: ${lpf}, ${settings({ time: effect.measures, feedback: effect.feedback, wetdry: mix })} }).connect()`
  ].join('\n');
}

/** The oscillator gain the app plays a sound at, to 3 decimals. */
function gainOf(p: SynthParams, preset: Preset): number {
  return round(p.amp * preset.gain, 3);
}

/** Each setting as a property, printed without float noise: 1 − 0.8 is 0.2, not 0.19999999999999996. */
function settings(values: Record<string, number>): string {
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${Number(value.toPrecision(12))}`)
    .join(', ');
}

function round(value: number, decimals: number): number {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}
