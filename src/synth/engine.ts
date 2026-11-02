/**
 * Gibber audio engine wrapper.
 *
 * TODO (milestone 2):
 *  - import Gibber from 'gibber.audio.lib'; await Gibber.init(); Gibber.export(window) (or keep a local handle)
 *  - create one instrument (start with Synth or FM) through one filter and one effect (Reverb or Delay)
 *  - update(params): set note (from scale + noteIndex), cutoff, gain, fx mix; respect mute/hold
 *  - applyPreset(preset): rebuild the chain from a Preset (see presets.ts)
 *  - currentCode(): return the Gibber code that would reproduce the current state as a string,
 *    e.g. "s = Synth('bleep').connect(Reverb()); s.note(5); s.cutoff = 0.72" — this is what ui/liveCode displays.
 *
 * Audio must start from a user gesture (browser autoplay policy): expose start() and call it from the UI "Start" button.
 */
import type { SynthParams } from '../mapping/handToSynth';
import type { Preset } from './presets';

export interface SynthEngine {
  start(): Promise<void>;
  update(p: SynthParams): void;
  applyPreset(p: Preset): void;
  currentCode(): string;
}

export async function createSynth(): Promise<SynthEngine> {
  // TODO replace stub with Gibber-backed implementation.
  let last = '';
  return {
    async start() {},
    update(p) { last = `// stub: note ${p.noteIndex} cutoff ${p.cutoff.toFixed(2)} amp ${p.amp.toFixed(2)}`; },
    applyPreset(p) { last = `// preset: ${p.name}`; },
    currentCode: () => last
  };
}
