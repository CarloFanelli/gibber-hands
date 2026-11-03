/**
 * The help sheet: a modal dialog listing every control and shortcut. "?" opens and closes it (ui/shortcuts);
 * Escape and its Close button close it too, and focus goes back where it was. The Close button comes first,
 * so the sheet opens on its top even when it has to scroll.
 */

export interface HelpSheet {
  /** Opens the sheet, or closes it if it is open. */
  toggle(): void;
}

const CONTENT = `
  <div class="help-head">
    <h2 id="help-title">How to play</h2>
    <form method="dialog"><button class="help-close">Close</button></form>
  </div>
  <h3>With your hand</h3>
  <dl>
    <dt>Palm center left or right</dt><dd>Picks the note: one note lane each</dd>
    <dt>Palm center up or down</dt><dd>Brighter or darker</dd>
    <dt>Thumb and index squeezed</dt><dd>Plays the note: the closer, the louder</dd>
    <dt>Closed fist</dt><dd>Silence</dd>
  </dl>
  <h3>Keys</h3>
  <dl>
    <dt><kbd>1</kbd>–<kbd>6</kbd></dt><dd>Pick a preset</dd>
    <dt><kbd>Space</kbd></dt><dd>Start or stop audio</dd>
    <dt><kbd>C</kbd></dt><dd>Hide or show the code panel</dd>
    <dt><kbd>?</kbd></dt><dd>Open or close this help</dd>
    <dt><kbd>Esc</kbd></dt><dd>Close this help</dd>
    <dt><kbd>Tab</kbd></dt><dd>Move between controls; <kbd>Space</kbd> or <kbd>Enter</kbd> presses one</dd>
    <dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Move the bar between panels that has focus</dd>
  </dl>
  <h3>Mouse and touch</h3>
  <dl>
    <dt>Start audio / Stop audio</dt><dd>Starts the sound, or silences it</dd>
    <dt>A preset card</dt><dd>Click or tap to pick it, or drag it onto “Now playing”</dd>
    <dt>Hide code / Show code</dt><dd>Hides or shows the code panel</dd>
    <dt>Copy</dt><dd>Copies the code; if the browser blocks it, selects the code to copy by hand</dd>
    <dt>Open gibber.cc</dt><dd>Opens the Gibber playground in a new tab, to paste the code and run it</dd>
    <dt>Selecting the code</dt><dd>Keeps it still until you click elsewhere</dd>
    <dt>The bars between panels</dt><dd>Drag to resize the panels; the sizes are remembered</dd>
    <dt>Sliders, without a camera</dt><dd>Stand in for your hand: palm center, pinches and gesture</dd>
  </dl>
`;

export function createHelpSheet(root: HTMLElement): HelpSheet {
  const dialog = document.createElement('dialog');
  dialog.className = 'help-sheet';
  dialog.setAttribute('aria-labelledby', 'help-title');
  dialog.innerHTML = CONTENT;
  root.append(dialog);
  return {
    toggle() {
      if (dialog.open) dialog.close();
      else dialog.showModal();
    }
  };
}
