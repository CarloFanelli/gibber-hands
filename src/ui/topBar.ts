/**
 * The top bar across the page, always in view: the name, the audio button, the camera and audio status, the
 * note that video stays on the device, the left-handed switch and Help. It only lays out the slots; the
 * controls in them come from their own modules (ui/audioPanel, ui/statusLine, ui/leadHandSwitch).
 */

import { OUTLINED } from './look';

export interface TopBar {
  audio: HTMLElement;
  status: HTMLElement;
  lead: HTMLElement;
  help: HTMLButtonElement;
}

/** A padlock, drawn in the text colour. */
const LOCK_ICON = `<svg class="inline size-3.5 flex-none" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
  <path d="M5 7V5a3 3 0 0 1 6 0v2h.5A1.5 1.5 0 0 1 13 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5v-5A1.5 1.5 0 0 1 4.5 7zm1.5 0h3V5a1.5 1.5 0 0 0-3 0z"/>
</svg>`;

export function createTopBar(root: HTMLElement): TopBar {
  const bar = document.createElement('header');
  // One row that never wraps; a narrower bar keeps the icons and drops words, which stay as tooltip and label.
  bar.className =
    '@container/top-bar flex h-15 flex-none items-center gap-4 border-b border-line bg-surface px-4 whitespace-nowrap max-[480px]:gap-1.5 max-[480px]:px-3';
  bar.innerHTML = `
    <span class="font-mono text-base font-semibold tracking-[0.02em] @max-[720px]/top-bar:hidden">gibber-hands</span>
    <div class="top-audio flex min-w-0 @max-[480px]/top-bar:flex-none"></div>
    <div class="top-status"></div>
    <p class="inline-flex items-center gap-1.5 text-sm text-muted" title="Video stays on your device">${LOCK_ICON}<span class="@max-[1100px]/top-bar:sr-only">Video stays on your device</span></p>
    <div class="top-lead ml-auto"></div>
    <button type="button" class="top-help ${OUTLINED} inline-flex items-center gap-2 px-3.5 text-base @max-[480px]/top-bar:px-2.5" aria-label="Help" title="How to play, every control and key (?)"><span class="inline-grid size-5.5 place-items-center rounded-[50%] border-[1.5px] border-current text-[13px] font-bold" aria-hidden="true">?</span><span class="@max-[900px]/top-bar:hidden" aria-hidden="true">Help</span></button>
  `;
  root.prepend(bar);
  return {
    audio: bar.querySelector('.top-audio')!,
    status: bar.querySelector('.top-status')!,
    lead: bar.querySelector('.top-lead')!,
    help: bar.querySelector('.top-help')!
  };
}
