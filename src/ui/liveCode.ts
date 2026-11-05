/**
 * The live code panel: the Gibber snippet in colour, a Copy button and a link to the gibber.cc playground.
 * While a selection touches the snippet it holds still, so it can be copied by hand while the hand moves;
 * the latest snippet shows once the selection leaves it.
 */
import { highlight } from './highlight';

/** How long "Copied", or the note that copying failed, stays, in ms. */
const COPY_NOTE_MS = 2000;

export interface LiveCode {
  show(code: string): void;
}

export function createLiveCode(root: HTMLElement): LiveCode {
  root.innerHTML = `
    <div class="code-tools">
      <button type="button" class="code-copy">Copy</button>
      <a class="code-open" href="https://gibber.cc/playground/" target="_blank" rel="noopener noreferrer">Open gibber.cc <span aria-hidden="true">↗</span></a>
      <span class="code-note" role="status"></span>
    </div>
    <pre class="code"></pre>
  `;
  const copy = root.querySelector<HTMLButtonElement>('.code-copy')!;
  const note = root.querySelector<HTMLElement>('.code-note')!;
  const codeEl = root.querySelector<HTMLElement>('.code')!;

  function render(code: string) {
    codeEl.replaceChildren(
      ...highlight(code).map((token) => {
        if (token.kind === 'plain') return token.text;
        const span = document.createElement('span');
        span.className = `code-${token.kind}`;
        span.textContent = token.text;
        return span;
      })
    );
  }

  function selectionTouchesCode(): boolean {
    const selection = document.getSelection();
    return selection !== null && !selection.isCollapsed && selection.containsNode(codeEl, true);
  }
  /** The latest snippet, while a selection holds the panel still. */
  let held: string | null = null;
  document.addEventListener('selectionchange', () => {
    if (held === null || selectionTouchesCode()) return;
    render(held);
    held = null;
  });

  let noteTimer: ReturnType<typeof setTimeout> | undefined;
  function say(words: string) {
    note.textContent = words;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => (note.textContent = ''), COPY_NOTE_MS);
  }
  function selectCode() {
    const range = document.createRange();
    range.selectNodeContents(codeEl);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  copy.addEventListener('click', () => {
    const code = codeEl.textContent ?? '';
    // Outside a secure context there is no clipboard: the TypeError rejects like a refusal does.
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(code))
      .then(
        () => say('Copied'),
        () => {
          selectCode();
          say('Copy failed — text selected');
        }
      );
  });

  return {
    show(code) {
      if (selectionTouchesCode()) held = code;
      else render(code);
    }
  };
}
