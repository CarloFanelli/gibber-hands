/**
 * In a window narrower than 720 px, the sounds panel and the side panel are bottom sheets: a bottom bar's two
 * buttons open one at a time over the camera. Its × button or a tap on the camera closes it, and the other
 * button swaps it for the other sheet. Crossing 720 px either way closes the open sheet. Wider, the bottom bar
 * is hidden and nothing here acts. Which sheet is open is the `data-sheet` attribute of `app`, which the panels'
 * classes read.
 */

/** The window width below which the panels are bottom sheets; the `max-[720px]:` classes use the same width. */
export const NARROW_QUERY = '(max-width: 719.98px)';

export type Sheet = 'sounds' | 'side';

const SHEET_NAME: Record<Sheet, string> = { sounds: 'Sounds', side: 'Code & gestures' };

export interface BottomSheets {
  /** Opens `sheet`, or closes it if it is open, in a narrow window only; says whether the window is narrow. */
  toggle(sheet: Sheet): boolean;
  /** Opens `sheet` in a narrow window only; says whether the window is narrow. */
  open(sheet: Sheet): boolean;
}

/** `panels` are the sounds panel and the side panel; `stage` is the camera view, a tap on which closes the sheet. */
export function createBottomSheets(app: HTMLElement, stage: HTMLElement, panels: Record<Sheet, HTMLElement>): BottomSheets {
  const narrow = matchMedia(NARROW_QUERY);
  const bar = document.createElement('nav');
  bar.className = 'hidden h-14 flex-none border-t border-line bg-surface max-[720px]:flex';
  bar.setAttribute('aria-label', 'Panels');
  const buttons = {} as Record<Sheet, HTMLButtonElement>;
  for (const sheet of ['sounds', 'side'] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'bottom-button flex-1 cursor-pointer border-0 bg-transparent font-[inherit] text-base font-semibold text-muted hover:text-fg active:bg-bg aria-expanded:text-fg aria-expanded:shadow-[inset_0_2px_0_var(--color-accent)]';
    button.textContent = SHEET_NAME[sheet];
    button.addEventListener('click', () => toggle(sheet));
    buttons[sheet] = button;
    bar.append(button);

    const close = document.createElement('button');
    close.type = 'button';
    close.className =
      'absolute top-1 right-1 z-1 hidden min-h-11 min-w-11 cursor-pointer rounded-lg border-0 bg-transparent text-[22px] text-fg hover:text-accent active:bg-bg max-[720px]:block';
    close.setAttribute('aria-label', `Close ${SHEET_NAME[sheet]}`);
    close.textContent = '×';
    close.addEventListener('click', () => show(null));
    panels[sheet].prepend(close);
  }
  app.append(bar);

  let open: Sheet | null = null;
  function show(sheet: Sheet | null, refocus = true) {
    // Closing from a control inside the sheet would drop focus to the page: it goes to the sheet's button.
    if (refocus && open && sheet !== open && panels[open].contains(document.activeElement)) buttons[open].focus();
    open = sheet;
    if (sheet) app.dataset.sheet = sheet;
    else delete app.dataset.sheet;
    for (const s of ['sounds', 'side'] as const) buttons[s].setAttribute('aria-expanded', String(s === sheet));
  }
  function toggle(sheet: Sheet) {
    if (!narrow.matches) return false;
    show(open === sheet ? null : sheet);
    return true;
  }

  // The sounds sheet sits inside the camera view: a tap there is not a tap on the camera.
  stage.addEventListener('click', (e) => {
    if (open && !(e.target instanceof Node && panels[open].contains(e.target))) show(null);
  });
  // Widened, the bottom bar is hidden and the sheet is a desktop panel again: focus stays where it is.
  narrow.addEventListener('change', () => show(null, narrow.matches));
  show(null);

  return {
    toggle,
    open(sheet) {
      if (!narrow.matches) return false;
      show(sheet);
      return true;
    }
  };
}
