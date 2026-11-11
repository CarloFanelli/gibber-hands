/**
 * The help dialog: every button and keyboard shortcut. The Help button and "?" open and close it (ui/shortcuts);
 * Escape and its Close button close it too. The gestures are explained in one place only, the gesture guide:
 * "Show gestures" closes this dialog and opens it. The Close button comes first, so the dialog opens on its
 * top even when it has to scroll.
 */
import { OUTLINED } from './look';
import { showModal } from './modal';

export interface HelpDialog {
  /** Opens the dialog, or closes it if it is open. */
  toggle(): void;
}

/** The look of the two section headings and their lists of terms; a phone's width puts each term above its meaning. */
const HEADING = 'mt-4 mb-1.5 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted';
const LIST =
  'grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 max-[480px]:grid-cols-1 max-[480px]:gap-0.5 [&_dt]:font-semibold max-[480px]:[&_dd+dt]:mt-2 [&_kbd]:inline-block [&_kbd]:min-w-[1.6em] [&_kbd]:rounded-sm [&_kbd]:border [&_kbd]:border-line-strong [&_kbd]:px-1.5 [&_kbd]:text-center [&_kbd]:font-mono [&_kbd]:text-sm [&_kbd]:leading-[1.5] [&_kbd]:font-normal';

const CONTENT = `
  <div class="flex items-center justify-between gap-4">
    <h2 id="help-title" class="text-xl">How to play</h2>
    <form method="dialog"><button class="dialog-close ${OUTLINED} self-start px-3.5 py-2.5 text-base">Close</button></form>
  </div>
  <p class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">Your hands play the notes. <button type="button" class="help-show-gestures min-h-11 cursor-pointer rounded-lg border border-accent bg-transparent px-3.5 font-[inherit] text-base font-semibold text-accent hover:bg-accent/12 active:bg-bg">Show gestures</button></p>
  <h3 class="${HEADING}">Keys</h3>
  <dl class="${LIST}">
    <dt><kbd>1</kbd>–<kbd>6</kbd></dt><dd>Pick a preset</dd>
    <dt><kbd>Space</kbd></dt><dd>Start or stop audio</dd>
    <dt><kbd>D</kbd></dt><dd>Start or stop the drums</dd>
    <dt><kbd>C</kbd></dt><dd>Collapse or expand the side panel with the code and the gestures</dd>
    <dt><kbd>S</kbd></dt><dd>Shrink the sounds panel to an icon, or open it again</dd>
    <dt><kbd>F</kbd></dt><dd>Show or hide the frame rate</dd>
    <dt><kbd>?</kbd></dt><dd>Open or close this help</dd>
    <dt><kbd>Esc</kbd></dt><dd>Close this help</dd>
    <dt><kbd>Tab</kbd></dt><dd>Move between controls; <kbd>Space</kbd> or <kbd>Enter</kbd> presses one</dd>
    <dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Move the bar beside the side panel, once it has focus; switch the side panel's tab, once a tab has focus</dd>
  </dl>
  <h3 class="${HEADING}">Buttons</h3>
  <dl class="${LIST}">
    <dt>Start audio / Stop audio</dt><dd>Starts the sound, or silences it</dd>
    <dt>Left-handed</dt><dd>Swaps the hands: the left hand leads; remembered for your next visit</dd>
    <dt>Start drums / Stop drums</dt><dd>Starts or stops a drum loop to play over; you hear it once audio is on</dd>
    <dt>◀ ▶ beside the drums</dt><dd>The previous or next drum pattern: Rock, House, Hip-hop, Breakbeat, each at its own tempo; a new one comes in on the next bar</dd>
    <dt>− + beside the drums</dt><dd>Fewer or more drum layers, from the kick alone to the full pattern; the arrows and − + work with the drums stopped too, and the next start plays your choice</dd>
    <dt>A preset card</dt><dd>Click or tap to pick it, or drag it onto “Now playing”</dd>
    <dt>The sounds panel’s title bar</dt><dd>Drag with the mouse to move the panel over the camera; its — button shrinks it to an icon, and the icon opens it; both are remembered</dd>
    <dt>Code and Gestures tabs</dt><dd>Show the live code or the gesture guide in the side panel; the choice is remembered</dd>
    <dt>❯ on the side panel</dt><dd>Collapses it into a strip at the edge, whose button expands it again</dd>
    <dt>The bar beside the side panel</dt><dd>Drag to resize the side panel; its width is remembered</dd>
    <dt>Copy</dt><dd>Copies the code; if the browser blocks it, selects the code to copy by hand</dd>
    <dt>Open gibber</dt><dd>Gibber's home page, in a new tab: the live-coding library that makes the sound</dd>
    <dt>Selecting the code</dt><dd>Keeps it still until you click elsewhere</dd>
    <dt>Sliders, without a camera</dt><dd>Stand in for your hand: palm center, pinches and gesture; the Octave choice (Down, Normal, Up) and the reverb or echo amount stand in for the second hand in shape mode</dd>
  </dl>
`;

/** `fallback` takes focus on close when the control that opened the dialog is gone; `onShowGestures` opens the guide. */
export function createHelpDialog(root: HTMLElement, fallback: () => HTMLElement | null, onShowGestures: () => void): HelpDialog {
  const dialog = document.createElement('dialog');
  dialog.className =
    'w-[min(560px,100%_-_32px)] rounded-xl border border-line-strong bg-surface px-6 py-5 text-fg backdrop:bg-black/60 max-[480px]:p-4';
  dialog.setAttribute('aria-labelledby', 'help-title');
  dialog.innerHTML = CONTENT;
  root.append(dialog);
  dialog.querySelector('.help-show-gestures')!.addEventListener('click', () => {
    // After the dialog has given focus back, so the guide's tab can take it.
    dialog.addEventListener('close', onShowGestures, { once: true });
    dialog.close();
  });
  return {
    toggle() {
      if (dialog.open) dialog.close();
      else showModal(dialog, fallback);
    }
  };
}
