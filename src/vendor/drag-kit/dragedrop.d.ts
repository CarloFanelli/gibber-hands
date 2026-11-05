/** Types for drag-kit's DragAndDrop, which is copied in as plain JavaScript: dragedrop.js, beside this file. */
export interface DragAndDropOptions {
  dragElements: {
    elementSelector: HTMLElement[];
    /** Classes on a card while it is dragged. */
    elementOnDragClassList: string[];
    /** Classes on a card while it is over a drop zone. They stay on it after a drop there. */
    elementHoverClassList: string[];
    /** Opacity, 0..100, of the copy left in the card's place while it is dragged. */
    placeholderOpacity: number;
  };
  dropZones: {
    elementSelector: HTMLElement[];
    /** Classes on every drop zone while a card is dragged. */
    elementDragClassList: string[];
    /** Classes on the drop zone a dragged card is over. */
    elementHoverClassList: string[];
  };
  /** Called when a card is released over a drop zone. */
  callback(dragElement: HTMLElement, dropZone: HTMLElement): void;
}

/** Mouse-only drag and drop: cards follow the pointer and go back to their place when released. */
export default class DragAndDrop {
  constructor(options: DragAndDropOptions);
}
