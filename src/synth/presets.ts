/**
 * The six presets: what the sounds panel lists, the notes each plays across the note lanes, and the
 * sound the engine builds and the live code snippet rebuilds. No Gibber import here, so the snippet and
 * its tests run without the browser bundle.
 *
 * Names, characters, scales, notes, effect types and mixes are fixed by the spec. The oscillator,
 * resonance, delay time and feedback are tuned by ear; each gain is measured, so that every preset peaks
 * under −3 dBFS at full volume and they all play about as loud.
 */
import type { Note } from '../mapping/handToSynth';
import { noteFrequency } from '../mapping/notes';

/** One of Gibber's stock oscillators. The pulse wave's width is the fraction of each cycle spent high. */
export type Oscillator = { shape: 'saw' | 'triangle' | 'square' } | { shape: 'pwm'; pulsewidth: number };

/** Gibber's stock Reverb or Delay. `mix` is the effect's share of the output; a delay's time is in measures. */
export type Effect = { kind: 'reverb'; mix: number } | { kind: 'delay'; mix: number; measures: number; feedback: number };

/** What the player sees each effect called. */
export const EFFECT_NAME: Record<Effect['kind'], string> = { reverb: 'Reverb', delay: 'Echo' };

export interface Preset {
  /** Saved in browser storage to restore the preset on the next visit. */
  id: string;
  name: string;
  character: string;
  scale: string;
  /** The notes of the note lanes, left to right: one for each of the most lanes; fewer lanes play the first ones. */
  lanes: readonly Note[];
  oscillator: Oscillator;
  /** Resonance of the ladder filter, 0..1: higher rings more at the cutoff. */
  resonance: number;
  /** Output gain at full volume. */
  gain: number;
  effect: Effect;
}

const lanes = (names: string) => names.split(' ').map((name) => ({ name, frequency: noteFrequency(name) }));

export const PRESETS: readonly Preset[] = [
  {
    id: 'saw-lead',
    name: 'Saw Lead',
    character: 'bright sawtooth lead',
    scale: 'A minor pentatonic',
    lanes: lanes('A3 C4 D4 E4 G4 A4 C5 D5 E5 G5 A5 C6 D6 E6 G6 A6'),
    oscillator: { shape: 'saw' },
    resonance: 0.5,
    gain: 1.4,
    effect: { kind: 'reverb', mix: 0.3 }
  },
  {
    id: 'warm-pad',
    name: 'Warm Pad',
    character: 'soft, slow string pad',
    scale: 'C major pentatonic',
    lanes: lanes('C4 D4 E4 G4 A4 C5 D5 E5 G5 A5 C6 D6 E6 G6 A6 C7'),
    oscillator: { shape: 'triangle' },
    resonance: 0.2,
    gain: 1.4,
    effect: { kind: 'reverb', mix: 0.6 }
  },
  {
    id: 'organ',
    name: 'Organ',
    character: 'hollow square-wave organ',
    scale: 'D dorian',
    lanes: lanes('D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5 A5 B5 C6 D6 E6'),
    oscillator: { shape: 'square' },
    resonance: 0.2,
    gain: 0.45,
    effect: { kind: 'delay', mix: 0.25, measures: 1 / 8, feedback: 0.3 }
  },
  {
    id: 'deep-bass',
    name: 'Deep Bass',
    character: 'round low bass',
    scale: 'E minor pentatonic',
    lanes: lanes('E2 G2 A2 B2 D3 E3 G3 A3 B3 D4 E4 G4 A4 B4 D5 E5'),
    oscillator: { shape: 'saw' },
    resonance: 0.3,
    gain: 0.9,
    effect: { kind: 'reverb', mix: 0.1 }
  },
  {
    id: 'brass',
    name: 'Brass',
    character: 'brassy synth horn',
    scale: 'F major',
    lanes: lanes('F3 G3 A3 B♭3 C4 D4 E4 F4 G4 A4 B♭4 C5 D5 E5 F5 G5'),
    oscillator: { shape: 'pwm', pulsewidth: 0.35 },
    resonance: 0.3,
    gain: 0.85,
    effect: { kind: 'reverb', mix: 0.25 }
  },
  {
    id: 'blues-reed',
    name: 'Blues Reed',
    character: 'nasal reedy lead',
    scale: 'A blues',
    lanes: lanes('A3 C4 D4 E♭4 E4 G4 A4 C5 D5 E♭5 E5 G5 A5 C6 D6 E♭6'),
    oscillator: { shape: 'pwm', pulsewidth: 0.15 },
    resonance: 0.6,
    gain: 1.2,
    effect: { kind: 'delay', mix: 0.3, measures: 3 / 16, feedback: 0.35 }
  }
];

/** The preset saved under `id`, or Saw Lead when nothing was saved or that preset no longer exists. */
export function presetIndex(id: string | null): number {
  return Math.max(0, PRESETS.findIndex((p) => p.id === id));
}

/** Freeverb's settings for a reverb mix: `wet1` is the reverb, `wet2` the other channel's reverb, `dry` the voice itself. */
export function reverbMix(mix: number) {
  return { wet1: mix, wet2: 0, dry: 1 - mix };
}

/** Gibber's default tempo, at which it reads a Delay's time in measures of 4 beats. */
export const GIBBER_BPM = 140;

/** A delay time in measures, as Gibber reads it at `bpm`, in samples, as Gibberish's Delay takes it. */
export function delaySamples(measures: number, bpm: number, sampleRate: number): number {
  return ((measures * 4 * 60) / bpm) * sampleRate;
}
