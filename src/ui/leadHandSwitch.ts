/**
 * The top bar's swap control for left-handed players: pressed, the left hand is the lead hand
 * and the right hand the second hand.
 */
import type { Side } from '../hands/types';

export function createLeadHandSwitch(root: HTMLElement, lead: Side, onChange: (lead: Side) => void): void {
  let current = lead;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'lead-hand';
  button.textContent = 'Left-handed';
  const show = () => button.setAttribute('aria-pressed', String(current === 'left'));
  show();
  button.addEventListener('click', () => {
    current = current === 'left' ? 'right' : 'left';
    show();
    onChange(current);
  });
  root.append(button);
}
