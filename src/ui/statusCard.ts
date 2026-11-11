import { FILLED } from './look';

/** A card with a live message and a Try again button, hidden until a failure shows it. `look` gives the card's
 * classes, as the camera view and the top bar draw it differently. */
export function statusCard(root: HTMLElement, onRetry: () => void, look: string) {
  const card = document.createElement('div');
  card.className = `status-card ${look}`;
  const message = document.createElement('p');
  message.setAttribute('role', 'status');
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = `${FILLED} px-3.5 py-2.5 disabled:cursor-default disabled:opacity-50`;
  retry.textContent = 'Try again';
  retry.hidden = true;
  retry.addEventListener('click', onRetry);
  card.append(message, retry);
  root.append(card);
  return { card, message, retry };
}
