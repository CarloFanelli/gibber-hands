/**
 * The live code: the Gibber snippet in colour, a Copy button and "Open gibber", a credit link to Gibber's home page.
 * While a selection touches the snippet it holds still, so it can be copied by hand while the hand moves;
 * the latest snippet shows once the selection leaves it.
 */
import { highlight, type Token } from './highlight';
import { OUTLINED } from './look';

/** How long "Copied", or the note that copying failed, stays, in ms. */
const COPY_NOTE_MS = 2000;

/** The colour of each kind of token in the snippet, written out so Tailwind finds every class. */
const TOKEN_LOOK: Record<Exclude<Token['kind'], 'plain'>, string> = {
  keyword: 'text-accent',
  number: 'text-code-number',
  comment: 'text-muted italic'
};

export interface LiveCode {
  show(code: string): void;
}

export function createLiveCode(root: HTMLElement): LiveCode {
  root.innerHTML = `
    <div class="flex flex-wrap items-center gap-2 px-4 pt-4">
      <button type="button" class="code-copy ${OUTLINED} self-start px-3.5 py-2.5 text-base" title="Copy the code, to paste into Gibber and keep playing it">Copy</button>
      <a class="${OUTLINED} inline-flex items-center gap-1.5 self-start px-3.5 py-2.5 text-base no-underline" href="https://gibber.cc/" target="_blank" rel="noopener noreferrer" title="Gibber, the live-coding library that makes the sound, in a new tab">Open gibber <span aria-hidden="true">↗</span></a>
      <span class="code-note text-sm text-muted" role="status"></span>
    </div>
    <pre class="code m-0 flex-auto overflow-y-auto p-4 font-mono text-sm/[1.5] wrap-anywhere whitespace-pre-wrap"></pre>
  `;
  const copy = root.querySelector<HTMLButtonElement>('.code-copy')!;
  const note = root.querySelector<HTMLElement>('.code-note')!;
  const codeEl = root.querySelector<HTMLElement>('.code')!;

  function render(code: string) {
    codeEl.replaceChildren(
      ...highlight(code).map((token) => {
        if (token.kind === 'plain') return token.text;
        const span = document.createElement('span');
        span.className = TOKEN_LOOK[token.kind];
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
