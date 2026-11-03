/**
 * The live code: Gibber code that plays the sound the hand asks for, to paste into the gibber.cc
 * playground. Pure, so it is shown before "Start audio", with the sliders, and in tests.
 *
 * It rebuilds the engine's chain from Gibber's stock objects: the same sawtooth into the same ladder
 * filter, then the same reverb. Not the stock Synth: its envelope also scales the volume and the cutoff.
 * The volume becomes the sawtooth's gain. Everything after it is linear, so the level matches the app,
 * which applies it after the reverb.
 */
import { NOTE_LANES, type SynthParams } from '../mapping/handToSynth';
import { FULL_VOLUME, RESONANCE, REVERB } from './sound';

export function gibberSnippet(p: SynthParams): string {
  const frequency = round(p.frequency, 2);
  const cutoff = Math.round(p.cutoff);
  const gain = round(p.amp * FULL_VOLUME, 3);
  const note = NOTE_LANES.find((n) => n.frequency === p.frequency)?.name ?? `${frequency} Hz`;
  return [
    `// gibber-hands: ${note}, brightness ${cutoff} Hz, volume ${Math.round(p.amp * 100)}%`,
    ...(gain === 0 ? [`// Silent right now. To hear it, run: saw.gain = ${FULL_VOLUME}`] : []),
    `saw = Saw({ frequency: ${frequency}, gain: ${gain} })`,
    // The ladder filter takes its cutoff as a fraction of the Nyquist frequency.
    `lpf = Filter24Moog({ input: saw, Q: ${RESONANCE}, cutoff: ${cutoff} / (Gibberish.ctx.sampleRate / 2) })`,
    `verb = Reverb({ input: lpf, wet1: ${REVERB.wet1}, wet2: ${REVERB.wet2}, dry: ${REVERB.dry} }).connect()`
  ].join('\n');
}

function round(value: number, decimals: number): number {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}
