/**
 * The top bar across the page, always in view: the name, the audio button, the camera and audio status, the
 * note that video stays on the device, the left-handed switch and Help. It only lays out the slots; the
 * controls in them come from their own modules (ui/audioPanel, ui/statusLine, ui/leadHandSwitch).
 */

export interface TopBar {
  audio: HTMLElement;
  status: HTMLElement;
  lead: HTMLElement;
  help: HTMLButtonElement;
}

/** A padlock, drawn in the text colour. */
const LOCK_ICON = `<svg class="top-icon" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
  <path d="M5 7V5a3 3 0 0 1 6 0v2h.5A1.5 1.5 0 0 1 13 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5v-5A1.5 1.5 0 0 1 4.5 7zm1.5 0h3V5a1.5 1.5 0 0 0-3 0z"/>
</svg>`;

export function createTopBar(root: HTMLElement): TopBar {
  const bar = document.createElement('header');
  bar.className = 'top-bar';
  bar.innerHTML = `
    <span class="top-name">gibber-hands</span>
    <div class="top-audio"></div>
    <div class="top-status"></div>
    <p class="top-privacy" title="Video stays on your device">${LOCK_ICON}<span class="top-words">Video stays on your device</span></p>
    <div class="top-lead"></div>
    <button type="button" class="top-help" aria-label="Help"><span aria-hidden="true">?</span><span class="top-words" aria-hidden="true">Help</span></button>
  `;
  root.prepend(bar);
  return {
    audio: bar.querySelector('.top-audio')!,
    status: bar.querySelector('.top-status')!,
    lead: bar.querySelector('.top-lead')!,
    help: bar.querySelector('.top-help')!
  };
}
