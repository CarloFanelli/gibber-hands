/**
 * The six presets in the instrument panel, as buttons showing each one's number key, name, character
 * and scale. Picking one only reports it; the selected one is marked once show() is called.
 */
import { PRESETS } from '../synth/presets';

export interface PresetList {
  /** Marks preset `index` (a PRESETS index) as the selected one. */
  show(index: number): void;
}

export function createPresetList(root: HTMLElement, onPick: (index: number) => void): PresetList {
  const list = document.createElement('div');
  list.className = 'presets';
  list.setAttribute('role', 'group');
  list.setAttribute('aria-label', 'Presets');
  const buttons = PRESETS.map((preset, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset';
    button.append(
      text('preset-key', String(i + 1)),
      text('preset-name', preset.name),
      text('preset-character', preset.character),
      text('preset-scale', preset.scale)
    );
    button.addEventListener('click', () => onPick(i));
    return button;
  });
  list.append(...buttons);
  root.append(list);

  return {
    show(index) {
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    }
  };
}

function text(className: string, content: string) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = content;
  return span;
}
