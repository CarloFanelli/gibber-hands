import { describe, expect, it } from 'vitest';
import type { SynthParams } from '../src/mapping/handToSynth';
import { PRESETS } from '../src/synth/presets';
import { gibberSnippet } from '../src/synth/snippet';
import { highlight } from '../src/ui/highlight';

const playing: SynthParams = { lane: 4, frequency: 392, cutoff: 1131, amp: 0.8, ampRampMs: 15, octave: 0 };
const silent: SynthParams = { ...playing, amp: 0 };
const snippets = PRESETS.flatMap((preset) => [gibberSnippet([playing, playing], preset, 0.45), gibberSnippet([silent], preset, preset.effect.mix)]);

describe('highlight', () => {
  it('colours stock constructors as keywords and numbers as numbers, the rest in the default colour', () => {
    expect(highlight('saw = Saw({ frequency: 392, gain: 0.25 })')).toEqual([
      { kind: 'plain', text: 'saw = ' },
      { kind: 'keyword', text: 'Saw' },
      { kind: 'plain', text: '({ frequency: ' },
      { kind: 'number', text: '392' },
      { kind: 'plain', text: ', gain: ' },
      { kind: 'number', text: '0.25' },
      { kind: 'plain', text: ' })' }
    ]);
  });

  it('colours a comment to the end of its line, numbers in it included', () => {
    expect(highlight('// Saw Lead: G4, brightness 1131 Hz\nlpf')).toEqual([
      { kind: 'comment', text: '// Saw Lead: G4, brightness 1131 Hz' },
      { kind: 'plain', text: '\nlpf' }
    ]);
  });

  it('keeps digits inside a name, and a division, out of the numbers and comments', () => {
    expect(highlight('Filter24Moog({ cutoff: 900 / 2 })')).toEqual([
      { kind: 'keyword', text: 'Filter24Moog' },
      { kind: 'plain', text: '({ cutoff: ' },
      { kind: 'number', text: '900' },
      { kind: 'plain', text: ' / ' },
      { kind: 'number', text: '2' },
      { kind: 'plain', text: ' })' }
    ]);
  });

  it('leaves names it does not know in the default colour', () => {
    expect(highlight('Synth().connect()')).toEqual([{ kind: 'plain', text: 'Synth().connect()' }]);
    expect(highlight('saw.gain = x')).toEqual([{ kind: 'plain', text: 'saw.gain = x' }]);
  });

  it('keeps every character of every preset snippet, in order', () => {
    for (const code of snippets) expect(highlight(code).map((t) => t.text).join('')).toBe(code);
  });

  it('colours every constructor a preset snippet calls as a keyword', () => {
    for (const code of snippets) {
      const calls = [...code.matchAll(/\b([A-Z]\w*)\(/g)].map((m) => m[1]);
      const keywords = highlight(code).filter((t) => t.kind === 'keyword').map((t) => t.text);
      expect(calls.length).toBeGreaterThan(0);
      expect(keywords).toEqual(calls);
    }
  });
});
