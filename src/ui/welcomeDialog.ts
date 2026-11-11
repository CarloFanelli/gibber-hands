/**
 * The welcome dialog: what the page does in one sentence, and "Start playing", which starts audio and closes it
 * with one click. It opens on every visit until a first sound has lasted a second (the step hints' rule, in
 * main.ts). Its × button, Escape or a click outside close it without starting audio; the step hints then guide.
 */
import { OUTLINED } from './look';
import { showModal } from './modal';

export interface WelcomeDialog {
  /** Closes the dialog, if it is open. */
  close(): void;
}

const CONTENT = `
  <div class="grid gap-4 p-6">
    <div class="flex items-center justify-between gap-4">
      <h2 id="welcome-title" class="text-xl">Play a synth with your hands</h2>
      <form method="dialog"><button class="dialog-close ${OUTLINED} min-w-11 p-0 text-xl" aria-label="Close">×</button></form>
    </div>
    <p class="leading-[1.5] text-muted">Raise your hand in front of the camera: where it is picks the note, and squeezing thumb and index plays it. Video stays on your device.</p>
    <button type="button" class="welcome-start min-h-15 cursor-pointer rounded-lg border-0 bg-accent font-[inherit] text-xl font-semibold text-accent-ink shadow-glow hover:bg-accent-hover active:brightness-90">Start playing</button>
  </div>
`;

/** Opens the dialog; `onStart` starts audio. `fallback` takes focus once it closes. */
export function openWelcomeDialog(root: HTMLElement, onStart: () => void, fallback: () => HTMLElement | null): WelcomeDialog {
  const dialog = document.createElement('dialog');
  dialog.className =
    'welcome-dialog w-[min(480px,100%_-_32px)] rounded-xl border border-line-strong bg-surface p-0 text-fg backdrop:bg-black/60';
  dialog.setAttribute('aria-labelledby', 'welcome-title');
  dialog.innerHTML = CONTENT;
  root.append(dialog);
  const start = dialog.querySelector<HTMLButtonElement>('.welcome-start')!;
  start.addEventListener('click', () => {
    // A second click of a double-click finds the dialog closed, so audio starts once.
    if (!dialog.open) return;
    dialog.close();
    onStart();
  });
  // The dialog's content fills it with no padding around: a click on the dialog itself is on the backdrop.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  showModal(dialog, fallback);
  start.focus();
  return {
    close() {
      if (dialog.open) dialog.close();
    }
  };
}
