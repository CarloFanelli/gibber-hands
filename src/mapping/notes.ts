/**
 * Note names to frequencies, in equal temperament from A4 = 440 Hz. A name is a letter A–G, an optional
 * flat sign (♭) and an octave number: C4 is middle C, B♭3 the B flat just below it.
 */

const SEMITONES_FROM_C: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteFrequency(name: string): number {
  const match = /^([A-G])(♭?)(\d)$/.exec(name);
  if (!match) throw new Error(`Not a note name: "${name}"`);
  const [, letter, flat, octave] = match;
  const semitonesFromA4 = SEMITONES_FROM_C[letter!]! - (flat ? 1 : 0) + 12 * (Number(octave) - 4) - 9;
  return 440 * 2 ** (semitonesFromA4 / 12);
}
