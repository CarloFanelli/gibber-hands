/** Presets: one object = one sound the user can pick without touching 20 controls. */
export interface Preset {
  id: string;
  name: string;
  instrument: 'Synth' | 'FM' | 'Monosynth' | 'Pluck';
  patch: string;          // Gibber preset name for the instrument, e.g. 'bleep', 'stabs'
  scale: string;          // e.g. 'minor', 'dorian', 'pentatonic'
  effect: 'Reverb' | 'Delay' | 'none';
  defaults: { cutoff: number; fx: number };
}

export function loadPresets(): Preset[] {
  // TODO (milestone 3): tune these by ear; keep 4–6, no more.
  return [
    { id: 'bleep', name: 'Bleep', instrument: 'Synth', patch: 'bleep', scale: 'pentatonic', effect: 'Reverb', defaults: { cutoff: 0.6, fx: 0.3 } },
    { id: 'pad', name: 'Pad', instrument: 'FM', patch: 'glockenspiel', scale: 'dorian', effect: 'Reverb', defaults: { cutoff: 0.4, fx: 0.6 } },
    { id: 'pluck', name: 'Pluck', instrument: 'Pluck', patch: 'default', scale: 'minor', effect: 'Delay', defaults: { cutoff: 0.8, fx: 0.4 } }
  ];
}
