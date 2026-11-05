/**
 * The live code: Gibber code that plays the sound the hand asks for, to paste into the gibber.cc
 * playground. Pure, so it is shown before "Start audio", with the sliders, and in tests.
 *
 * It rebuilds the engine's chain for the current preset from Gibber's stock objects: the same oscillator
 * into the same ladder filter, then the same reverb or delay. Not the stock Synth: its envelope also
 * scales the volume and the cutoff. The volume becomes the oscillator's gain. Everything after it is
 * linear, so the level matches the app, which applies it after the effect. Each sounding hand has its own
 * chain, as in the app. The effect's own mix gives the reverb or echo amount the app splits around it.
 */
import type { SynthParams } from '../mapping/handToSynth';
import { raiseOctave } from '../mapping/notes';
import { EFFECT_NAME, reverbMix, type Oscillator, type Preset } from './presets';

/** Gibber's constructor for each oscillator shape; the snippet names its variable after the shape. */
const STOCK_OSCILLATOR: Record<Oscillator['shape'], string> = { saw: 'Saw', triangle: 'Triangle', square: 'Square', pwm: 'PWM' };
/** Every stock Gibber constructor a snippet can call. */
export const STOCK_NAMES: readonly string[] = [...Object.values(STOCK_OSCILLATOR), 'Filter24Moog', 'Reverb', 'Delay'];

/**
 * `sounds` are the hands' sounds, the lead hand's first. Every sounding hand gets its own voice, the second
 * one's names ending in 2; while no hand sounds, the lead hand's voice is shown silent. `effect` is the
 * reverb or echo amount, 0..1, for every voice.
 */
export function gibberSnippet(sounds: readonly SynthParams[], preset: Preset, effect: number): string {
  const sounding = sounds.filter((p) => gainOf(p, preset) > 0);
  const voices = sounding.length > 0 ? sounding : sounds.slice(0, 1);
  const mix = round(effect, 3);
  return voices.map((p, i) => voiceCode(p, preset, i, mix)).join('\n');
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
