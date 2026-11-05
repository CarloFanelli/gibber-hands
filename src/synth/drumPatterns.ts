/**
 * The drum patterns: what each plays on the sixteenth notes of a 4/4 bar, and at which tempo. The engine
 * plays them on Gibberish's synthesized kick, snare and hi-hat. No Gibber import here, so tests run without
 * the browser bundle.
 *
 * Names, tempos and the order of the drum layers are fixed by the spec; the hits are tuned by ear.
 */

/** The kit's drums. */
export type Drum = 'kick' | 'snare' | 'hat';

/** How many parts of a drum pattern play: 1 the kick, 2 adds the snare, 3 the closed hi-hat, 4 the extra hits. */
export type DrumLayers = 1 | 2 | 3 | 4;

/** A drum loop to play: a DRUM_PATTERNS index, and its drum layers. */
export interface Drums {
  pattern: number;
  layers: DrumLayers;
}

/** One of Gibberish's (and Gibber's) stock synthesized drums. */
export type Instrument = 'Kick' | 'Snare' | 'Hat';

/** Each drum: the stock instrument that plays it, and its settings there. The gains set the drum mix. Tuned by ear. */
export const KIT: Record<Drum, { instrument: Instrument; settings: Record<string, number> }> = {
  kick: { instrument: 'Kick', settings: { gain: 0.3 } },
  snare: { instrument: 'Snare', settings: { gain: 0.18 } },
  hat: { instrument: 'Hat', settings: { gain: 0.1 } }
};

/** A loud ("x") or soft ("o") hit of one drum, at a step of the bar. */
export interface Hit {
  drum: Drum;
  /** 0..1 */
  loudness: number;
}

/** One drum's part in a drum pattern: a character per step, "x" loud, "o" soft, "." silent. */
interface Part {
  drum: Drum;
  /** The drum layer it starts in. */
  layer: DrumLayers;
  steps: string;
}

export interface DrumPattern {
  name: string;
  bpm: number;
  parts: readonly Part[];
}

/** Steps in a bar: sixteenth notes of 4/4. */
export const STEPS = 16;

/** The loudness of a soft hit. Tuned by ear. */
const SOFT = 0.45;

export const DRUM_PATTERNS: readonly DrumPattern[] = [
  {
    name: 'Rock',
    bpm: 110,
    parts: [
      { drum: 'kick', layer: 1, steps: 'x.......x.......' },
      { drum: 'snare', layer: 2, steps: '....x.......x...' },
      { drum: 'hat', layer: 3, steps: 'x.o.x.o.x.o.x.o.' },
      { drum: 'kick', layer: 4, steps: '..........x.....' },
      { drum: 'snare', layer: 4, steps: '...............o' }
    ]
  }
];

/** Each step's hits, in bar order, with `layers` drum layers playing. */
export function drumSteps(pattern: DrumPattern, layers: DrumLayers): Hit[][] {
  return Array.from({ length: STEPS }, (_, step) =>
    pattern.parts.flatMap(({ drum, layer, steps }) => {
      const mark = steps[step];
      if (layer > layers || (mark !== 'x' && mark !== 'o')) return [];
      return [{ drum, loudness: mark === 'x' ? 1 : SOFT }];
    })
  );
}

/** A step's length in samples at `bpm`, unrounded: the clock rounds each step's time, never its length. */
export function stepSamples(bpm: number, sampleRate: number): number {
  return (60 / bpm / 4) * sampleRate;
}
