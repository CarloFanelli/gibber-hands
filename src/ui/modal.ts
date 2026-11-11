/**
 * Opens a dialog as a modal: the page behind it is inert, so focus stays inside until it closes. Closed, it
 * gives focus back to the control that opened it, or to `fallback` when that control is gone or hidden.
 */
export function showModal(dialog: HTMLDialogElement, fallback: () => HTMLElement | null): void {
  const opener = document.activeElement;
  dialog.showModal();
  dialog.addEventListener(
    'close',
    () => {
      const back = opener instanceof HTMLElement && opener !== document.body && opener.isConnected && opener.offsetParent !== null;
      (back ? opener : fallback())?.focus();
    },
    { once: true }
  );
}
