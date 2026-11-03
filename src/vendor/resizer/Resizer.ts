/*
 * Copied from Resizer by Carlo Fanelli (2024):
 * https://github.com/CarloFanelli/Resizer/blob/41bb3caeb96e44f805aacd81c5baa9c37921ad70/src/Resizer.ts
 *
 * Fixes, the only changes from that commit: none.
 */
class Resizer {
    private classList: string;

    constructor(option: string) {
        this.classList = option;
    }

    createResizer(element: HTMLElement): HTMLElement {
        const resizer = document.createElement('div');
        resizer.classList.value = this.classList;
        resizer.draggable = false;
        element.insertAdjacentElement('afterend', resizer);
        return resizer;
    }
}

export default Resizer;
