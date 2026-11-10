/**
 * Keyboard shortcuts: 1–6 pick a preset, Space starts or stops audio, D starts or stops the drums, C collapses
 * or expands the side panel and "?" opens or closes help. Escape is left to the help sheet, which closes on it
 * by itself.
 */
import { PRESETS } from '../synth/presets';

export type Action = { kind: 'preset'; index: number } | { kind: 'audio' } | { kind: 'drums' } | { kind: 'side-panel' } | { kind: 'help' };

/** The parts of a key press the shortcuts read: a KeyboardEvent has them all. */
export type KeyPress = Pick<KeyboardEvent, 'key' | 'repeat' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>;

/**
 * What has focus: a field takes typed keys (the gesture menu picks an option by its first letter), a control
 * is pressed by Space (a preset card, a button, a link), anything else leaves every key to the shortcuts.
 */
export type Focus = 'field' | 'control' | 'other';

/**
 * The action of a key press, or null. `key` is the character typed, so "?" works whether the layout needs
 * Shift for it or not. A held key's repeats do nothing; with Ctrl, Cmd or Alt held the key is the browser's
 * or the system's.
 */
export function shortcut(k: KeyPress, focus: Focus): Action | null {
  if (k.repeat || k.ctrlKey || k.metaKey || k.altKey || focus === 'field') return null;
  if (k.key === ' ') return focus === 'control' ? null : { kind: 'audio' };
  if (k.key === '?') return { kind: 'help' };
  if (k.key === 'd' || k.key === 'D') return { kind: 'drums' };
  if (k.key === 'c' || k.key === 'C') return { kind: 'side-panel' };
  if (/^[1-9]$/.test(k.key) && Number(k.key) <= PRESETS.length) return { kind: 'preset', index: Number(k.key) - 1 };
  return null;
}

function focusOf(target: EventTarget | null): Focus {
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return 'field';
  if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) return 'control';
  return 'other';
}

/** Calls `onAction` for each shortcut pressed anywhere on the page; the key then does nothing else. */
export function listenForShortcuts(onAction: (action: Action) => void) {
  window.addEventListener('keydown', (e) => {
    const action = shortcut(e, focusOf(e.target));
    if (action === null) return;
    // Space would also scroll the page.
    e.preventDefault();
    onAction(action);
  });
}
