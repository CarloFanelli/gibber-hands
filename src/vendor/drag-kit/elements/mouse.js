/*
 * Copied from drag-kit by Carlo Fanelli (2024):
 * https://github.com/CarloFanelli/drag-kit/blob/b1dec91c12dce37b53404d96cb7eb411d7518b9b/assets/js/dragedrop/elements/mouse.js
 *
 * Fixes, the only changes from that commit: none.
 */
class Mouse {
    constructor() {
        this.position = {x: 0, y: 0};
        document.addEventListener('mousemove', this.detectMouse.bind(this));
    }

    detectMouse(event) {
        // this.position = {x: event.clientX, y: event.clientY};
        this.position = {x: event.pageX, y: event.pageY};
    }
}

export default Mouse;