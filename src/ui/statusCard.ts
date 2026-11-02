/** A card with a live message and a Try again button, hidden until a failure shows it. */
export function statusCard(root: HTMLElement, onRetry: () => void) {
  const card = document.createElement('div');
  card.className = 'status-card';
  const message = document.createElement('p');
  message.setAttribute('role', 'status');
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'retry';
  retry.textContent = 'Try again';
  retry.hidden = true;
  retry.addEventListener('click', onRetry);
  card.append(message, retry);
  root.append(card);
  return { card, message, retry };
}
