/**
 * Instrument panel drum controls: ◀ Start drums / Stop drums ▶ to start and stop the loop and step through
 * the drum patterns, − and + for the drum layers, and the loop's state in words, for example
 * "Drums: Rock · 110 BPM · layers 4/4". None can be pressed once the audio engine has failed.
 */
import type { DrumLoop } from '../mapping/drumLoop';
import type { EngineStatus } from '../synth/engine';
import { DRUM_PATTERNS } from '../synth/drumPatterns';

/** The loop in words, naming the drum pattern chosen at once: a new one is heard from the next bar. */
export function drumWords(loop: DrumLoop): string {
  const { name, bpm } = DRUM_PATTERNS[loop.pattern]!;
  return `${loop.playing ? 'Drums:' : 'Drums off ·'} ${name} · ${bpm} BPM · layers ${loop.layers}/4`;
}

type DrumButton = 'toggle' | 'previous' | 'next' | 'fewer' | 'more';

export interface DrumControls {
  label: 'Start drums' | 'Stop drums';
  disabled: Record<DrumButton, boolean>;
}

/** What the start button reads, and which drum buttons can't be pressed now. */
export function drumControls(loop: DrumLoop, engine: EngineStatus): DrumControls {
  const failed = engine.kind === 'failed';
  return {
    label: loop.playing ? 'Stop drums' : 'Start drums',
    disabled: { toggle: failed, previous: failed, next: failed, fewer: failed || loop.layers === 1, more: failed || loop.layers === 4 }
  };
}

export interface DrumActions {
  toggle(): void;
  /** The previous (-1) or next (1) drum pattern. */
  pattern(step: 1 | -1): void;
  /** One drum layer fewer (-1) or more (1). */
  layers(step: 1 | -1): void;
}

export interface DrumPanel {
  show(loop: DrumLoop, engine: EngineStatus): void;
  /** Presses Start drums or Stop drums, if it can be pressed now. */
  startOrStop(): void;
}

export function createDrumPanel(root: HTMLElement, actions: DrumActions): DrumPanel {
  const box = document.createElement('div');
  box.className = 'drum-panel';
  const button = (className: string, text: string, name: string | null, onClick: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.textContent = text;
    if (name) {
      b.setAttribute('aria-label', name);
      b.title = name;
    }
    b.addEventListener('click', onClick);
    return b;
  };
  const buttons: Record<DrumButton, HTMLButtonElement> = {
    previous: button('drum-step', '◀', 'Previous drum pattern', () => actions.pattern(-1)),
    toggle: button('drum-toggle', '', null, actions.toggle),
    next: button('drum-step', '▶', 'Next drum pattern', () => actions.pattern(1)),
    fewer: button('drum-step', '−', 'Fewer drum layers', () => actions.layers(-1)),
    more: button('drum-step', '+', 'More drum layers', () => actions.layers(1))
  };
  const line = document.createElement('p');
  line.className = 'drum-line';
  const layers = document.createElement('span');
  layers.className = 'drum-layers';
  layers.append(buttons.fewer, buttons.more);
  box.append(buttons.previous, buttons.toggle, buttons.next, layers, line);
  root.append(box);

  return {
    show(loop, engine) {
      const { label, disabled } = drumControls(loop, engine);
      buttons.toggle.textContent = label;
      for (const name of Object.keys(buttons) as DrumButton[]) buttons[name].disabled = disabled[name];
      const words = drumWords(loop);
      if (line.textContent !== words) line.textContent = words;
    },
    startOrStop() {
      if (!buttons.toggle.disabled) buttons.toggle.click();
    }
  };
}
