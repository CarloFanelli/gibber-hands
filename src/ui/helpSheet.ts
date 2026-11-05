/**
 * The help sheet: a modal dialog listing every control and shortcut. "?" opens and closes it (ui/shortcuts);
 * Escape and its Close button close it too, and focus goes back where it was. The Close button comes first,
 * so the sheet opens on its top even when it has to scroll. It names the hands by their current roles.
 */
import type { Side } from '../hands/types';
import { nameHands } from './handWords';

export interface HelpSheet {
  /** Opens the sheet, or closes it if it is open. */
  toggle(): void;
  /** Names the hands after the roles are swapped. */
  setLeadSide(side: Side): void;
}

const CONTENT = `
  <div class="help-head">
    <h2 id="help-title">How to play</h2>
    <form method="dialog"><button class="help-close">Close</button></form>
  </div>
  <h3>With your hand</h3>
  <dl>
    <dt>Palm center left or right</dt><dd>Picks the note: one note lane each; a wider camera picture gives more lanes, up to 16</dd>
    <dt>Palm center up or down</dt><dd>Brighter or darker</dd>
    <dt>Thumb and index squeezed</dt><dd>Plays the note: the closer, the louder</dd>
    <dt>Closed fist</dt><dd>Silence</dd>
  </dl>
  <h3>With two hands</h3>
  <dl>
    <dt><span data-hand="lead"></span> hand, the lead hand</dt><dd>Always plays notes</dd>
    <dt><span data-hand="second"></span> hand, the second hand</dt><dd>Plays notes too, so two can sound at once</dd>
    <dt><span data-hand="second"></span> hand: Victory sign ✌</dt><dd>Switches it between playing notes and shape mode, where it plays no note</dd>
    <dt>Shape mode: squeeze held</dt><dd>Every note one octave up, until you let go</dd>
    <dt><span data-hand="second"></span> hand in shape mode: thumbs-down held 👎</dt><dd>Every note one octave down, until you let go; the lead hand’s thumbs-down does nothing</dd>
    <dt>Shape mode: hand up or down</dt><dd>More or less reverb or echo; the middle gives the preset’s own amount</dd>
    <dt>Left-handed</dt><dd>Swaps the roles: the left hand leads; remembered for your next visit</dd>
  </dl>
  <h3>Keys</h3>
  <dl>
    <dt><kbd>1</kbd>–<kbd>6</kbd></dt><dd>Pick a preset</dd>
    <dt><kbd>Space</kbd></dt><dd>Start or stop audio</dd>
    <dt><kbd>C</kbd></dt><dd>Hide or show the code; the gesture guide stays</dd>
    <dt><kbd>?</kbd></dt><dd>Open or close this help</dd>
    <dt><kbd>Esc</kbd></dt><dd>Close this help</dd>
    <dt><kbd>Tab</kbd></dt><dd>Move between controls; <kbd>Space</kbd> or <kbd>Enter</kbd> presses one</dd>
    <dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Move the bar between panels that has focus</dd>
    <dt><kbd>↑</kbd> <kbd>↓</kbd></dt><dd>Move the divider between the code and the gesture guide, once it has focus</dd>
  </dl>
  <h3>Mouse and touch</h3>
  <dl>
    <dt>Start audio / Stop audio</dt><dd>Starts the sound, or silences it</dd>
    <dt>A preset card</dt><dd>Click or tap to pick it, or drag it onto “Now playing”</dd>
    <dt>Hide code / Show code</dt><dd>Hides or shows the code; the gesture guide below it stays</dd>
    <dt>Copy</dt><dd>Copies the code; if the browser blocks it, selects the code to copy by hand</dd>
    <dt>Open gibber.cc</dt><dd>Opens the Gibber playground in a new tab, to paste the code and run it</dd>
    <dt>Selecting the code</dt><dd>Keeps it still until you click elsewhere</dd>
    <dt>The bars between panels</dt><dd>Drag to resize the panels; the sizes are remembered</dd>
    <dt>The divider between code and guide</dt><dd>Drag to share the panel between the code and the gesture guide; the split is remembered</dd>
    <dt>Sliders, without a camera</dt><dd>Stand in for your hand: palm center, pinches and gesture; the Octave choice (Down, Normal, Up) and the reverb or echo amount stand in for the second hand in shape mode</dd>
  </dl>
`;

export function createHelpSheet(root: HTMLElement, leadSide: Side): HelpSheet {
  const dialog = document.createElement('dialog');
  dialog.className = 'help-sheet';
  dialog.setAttribute('aria-labelledby', 'help-title');
  dialog.innerHTML = CONTENT;
  root.append(dialog);
  nameHands(dialog, leadSide);
  return {
    toggle() {
      if (dialog.open) dialog.close();
      else dialog.showModal();
    },
    setLeadSide: (side) => nameHands(dialog, side)
  };
}
