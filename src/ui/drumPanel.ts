/**
 * Instrument panel drum controls: the Start drums / Stop drums button, and the loop's state in words, for
 * example "Drums: Rock · 110 BPM". The button can't be pressed while the audio engine has failed.
 */
import type { DrumLoop } from '../mapping/drumLoop';
import type { EngineStatus } from '../synth/engine';
import { DRUM_PATTERNS } from '../synth/drumPatterns';

export function drumWords(loop: DrumLoop): string {
  if (!loop.playing) return 'Drums off';
  const { name, bpm } = DRUM_PATTERNS[loop.pattern]!;
  return `Drums: ${name} · ${bpm} BPM`;
}

export interface DrumPanel {
  show(loop: DrumLoop, engine: EngineStatus): void;
  /** Presses Start drums or Stop drums, if it can be pressed now. */
  startOrStop(): void;
}

export function createDrumPanel(root: HTMLElement, onToggle: () => void): DrumPanel {
  const box = document.createElement('div');
  box.className = 'drum-panel';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'drum-toggle';
  toggle.addEventListener('click', onToggle);
  const line = document.createElement('p');
  line.className = 'drum-line';
  box.append(toggle, line);
  root.append(box);

  return {
    show(loop, engine) {
      toggle.textContent = loop.playing ? 'Stop drums' : 'Start drums';
      toggle.disabled = engine.kind === 'failed';
      const words = drumWords(loop);
      if (line.textContent !== words) line.textContent = words;
    },
    startOrStop() {
      if (!toggle.disabled) toggle.click();
    }
  };
}
