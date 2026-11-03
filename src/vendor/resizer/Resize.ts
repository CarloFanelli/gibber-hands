/*
 * Copied from Resizer by Carlo Fanelli (2024):
 * https://github.com/CarloFanelli/Resizer/blob/41bb3caeb96e44f805aacd81c5baa9c37921ad70/src/Resize.ts
 *
 * Fixes, the only changes from that commit:
 *  1. Strict TypeScript (noUncheckedIndexedAccess): the 5 possibly-undefined array reads are asserted, and
 *     the width-as-a-percentage-of-the-row sum they were part of becomes one helper, also used by fix 6.
 *  2. Storage that is blocked or throws no longer breaks the page, and a saved list that is unreadable,
 *     has another number of entries, or holds a width that is not a positive number is ignored.
 *  3. Hiding an element no longer rescales the saved widths by position: the visible elements take their
 *     own saved widths, scaled to fill the row together.
 *  4. A drag stops where either neighbour reaches its CSS min-width, and the handle stays on that edge.
 *  5. A move with no mouse button held ends the drag, so releasing outside the window ends it there.
 *  6. When a drag ends, the two resized elements go back to percentage widths, so the row keeps its
 *     proportions when the window is resized.
 *  7. An element hidden when sizes are first saved keeps its CSS percentage, instead of being saved at 0.
 *  8. The console.log of the options is removed.
 */
import Resizer from "./Resizer.js";

interface ResizeOptions {
  resizableElements: HTMLElement[];
  resizerClassList: string;
  saveName: string;
  classToCheck: string;
}

type SavedSize = { id: string, percW: number };

class Resize {
  private resizableElements: HTMLElement[];
  private resizerClassList: string;
  private memoryName: string;
  private classToCheck: string;
  private resizer: Resizer;

  constructor(option: ResizeOptions) {
    this.resizableElements = option.resizableElements;
    this.resizerClassList = option.resizerClassList;
    this.memoryName = option.saveName;
    this.classToCheck = option.classToCheck;

    this.giveSize(this.resizableElements);
    this.resizer = new Resizer(this.resizerClassList);

    this.addResizer(this.resizableElements, this.resizerClassList).forEach(resizer => {
      this.moveResizer(resizer, this.resizableElements);
    });

    this.resizableElements.forEach(el => {
      this.observeElementChanges(el, this.resizableElements, this.classToCheck);
    });
  }

  private observeElementChanges(targetElement: HTMLElement, resizableElement: HTMLElement[], classToCheck: string): void {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (targetElement.classList.contains(classToCheck)) {
            this.giveSize(this.checkResizableElement(this.resizableElements));
          } else {
            this.giveSize(this.checkResizableElement(this.resizableElements));
          }
        }
      }
    });

    observer.observe(targetElement, { attributes: true });
  }

  private checkResizableElement(elements: HTMLElement[]): HTMLElement[] {
    let result:HTMLElement[] = [];
    elements.forEach(el => {
      if (!el.classList.contains(this.classToCheck)) {
        result.push(el);
      }
    })
    return result;
  }

  private giveSize(resizableElement: HTMLElement[]): void {
    const sizes = readSizes(this.memoryName, this.resizableElements.length);

    if (sizes) {
      const share = (el: HTMLElement) => sizes[this.resizableElements.indexOf(el)]!.percW;
      const sharesSum = resizableElement.reduce((sum, el) => sum + share(el), 0);

      resizableElement.forEach(el => {
        el.style.width = (share(el) * 100 / sharesSum) + '%';
      });
    }
  }

  private addResizer(elementArray: HTMLElement[], classList: string): HTMLElement[] {
    const resizers: HTMLElement[] = [];
    for (let i = 0; i < (elementArray.length - 1); i++) {
      const elem = elementArray[i]!;
      const resizer = document.createElement('div');
      resizer.classList.value = classList;
      resizer.draggable = false;

      elem.insertAdjacentElement('afterend', resizer);
      resizers.push(resizer);
    }
    return resizers;
  }

  private moveResizer(resizer: HTMLElement, resizableElement: HTMLElement[]): void {
    const memoryName = this.memoryName;
    const classToCheck = this.classToCheck;
    const check = this.checkResizableElement.bind(this);

    let mouseXStart: number | null = null;
    let rightDiv: HTMLElement | null = null;
    let rightDivInitialWidth: number | null = null;
    let rightDivMinWidth = 0;
    let leftDiv: HTMLElement | null = null;
    let leftDivInitialWidth: number | null = null;
    let leftDivMinWidth = 0;
    let trueResizable: HTMLElement[] | null = null;

    resizer.onmousedown = dragMouseDown;

    function percentOfParent(el: HTMLElement): number {
      return (el.getBoundingClientRect().width * 100) / el.parentElement!.getBoundingClientRect().width;
    }

    function dragMouseDown(e: MouseEvent) {
      e.preventDefault();

      trueResizable = check(resizableElement);

      mouseXStart = e.clientX;
      const resizerH = resizer.getBoundingClientRect().height;
      resizer.style.position = 'absolute';
      resizer.style.height = resizerH + 'px';
      resizer.style.left = mouseXStart + 'px';

      rightDiv = resizer.nextElementSibling as HTMLElement;
      leftDiv = resizer.previousElementSibling as HTMLElement;

      rightDivInitialWidth = rightDiv.getBoundingClientRect().width;
      leftDivInitialWidth = leftDiv.getBoundingClientRect().width;
      rightDivMinWidth = parseFloat(getComputedStyle(rightDiv).minWidth) || 0;
      leftDivMinWidth = parseFloat(getComputedStyle(leftDiv).minWidth) || 0;

      document.onmouseup = closemoveResizer;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e: MouseEvent) {
      e.preventDefault();
      if (e.buttons === 0) {
        closemoveResizer();
        return;
      }

      const mouseDelta = Math.min(
        Math.max(e.clientX - (mouseXStart as number), leftDivMinWidth - (leftDivInitialWidth as number)),
        (rightDivInitialWidth as number) - rightDivMinWidth
      );
      resizer.style.left = ((mouseXStart as number) + mouseDelta) + "px";

      if (leftDiv && rightDiv) {
        leftDiv.style.width = (leftDivInitialWidth as number + mouseDelta) + 'px';
        rightDiv.style.width = (rightDivInitialWidth as number - mouseDelta) + 'px';
      }
    }

    function closemoveResizer() {
      document.onmouseup = null;
      document.onmousemove = null;

      saveSize();
      if (leftDiv && rightDiv) {
        leftDiv.style.width = percentOfParent(leftDiv) + '%';
        rightDiv.style.width = percentOfParent(rightDiv) + '%';
      }
      resizer.style.position = '';
      resizer.style.height = '';
      resizer.style.left = '';
    }

    function saveSize() {
      let elSize: SavedSize[] = [];
      const saved = readSizes(memoryName, resizableElement.length);
      if (saved) {
        elSize = saved;

        elSize.forEach((size, i) => {
          const el = resizableElement[i]!;
          if (!el.classList.contains(classToCheck)) {
            size = {
              id: el.id,
              percW: percentOfParent(el)
            };
            elSize[i] = size;
          }
        });
      } else {
        resizableElement.forEach((el) => {
          // A hidden element measures 0 wide; its computed width is still the percentage its CSS gives.
          const percW = el.classList.contains(classToCheck) ? parseFloat(getComputedStyle(el).width) : percentOfParent(el);
          elSize.push({ id: el.id, percW: percW });
        });
      }
      try {
        localStorage.setItem(memoryName + 'Size', JSON.stringify(elSize));
      } catch {
        // Storage blocked: the sizes last for this visit only.
      }
    }
  }
}

function readSizes(memoryName: string, count: number): SavedSize[] | null {
  try {
    const sizes: unknown = JSON.parse(localStorage.getItem(memoryName + 'Size') || 'null');
    if (Array.isArray(sizes) && sizes.length === count && sizes.every(size => Number.isFinite(size?.percW) && size.percW > 0)) {
      return sizes;
    }
  } catch {
    // Storage blocked or the saved text is not JSON: the same as nothing saved.
  }
  return null;
}

export default Resize;
