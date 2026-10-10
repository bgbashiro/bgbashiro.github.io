import { LAYOUT, contains } from './view/layout.js';

// Turns pointer/keyboard events into game actions. The controller awaits
// waitForAction() / waitForContinue(); everything else is ignored.
//
// Touch has no hover, so on touch/pen the first tap on an item only selects
// it (showing its tooltip) and a second tap uses it.
export class Input {
    constructor(canvas, getButtons) {
        this.canvas = canvas;
        this.getButtons = getButtons;
        this.mouse = { x: -1, y: -1 };
        this.resolveAction = null;
        this.resolveContinue = null;
        // Best guess until the first pointer event tells us for sure.
        this.pointerType = window.matchMedia?.('(pointer: coarse)').matches ? 'touch' : 'mouse';
        this.selectedId = null;

        canvas.addEventListener('pointermove', (e) => {
            this.pointerType = e.pointerType;
            this.mouse = this.toCanvas(e);
        });
        canvas.addEventListener('pointerleave', () => {
            this.mouse = { x: -1, y: -1 };
        });
        canvas.addEventListener('pointerdown', (e) => {
            this.pointerType = e.pointerType;
            this.handlePress(this.toCanvas(e));
        });
        window.addEventListener('keydown', (e) => this.handleKey(e));
    }

    toCanvas(e) {
        const r = this.canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - r.left) * LAYOUT.width) / r.width,
            y: ((e.clientY - r.top) * LAYOUT.height) / r.height,
        };
    }

    get isTouch() {
        return this.pointerType !== 'mouse';
    }

    // The button whose tooltip should show: under the mouse, or tap-selected.
    hoveredButton() {
        const buttons = this.getButtons();
        if (this.selectedId) return buttons.find((b) => b.id === this.selectedId) ?? null;
        if (this.isTouch) return null;
        return buttons.find((b) => contains(b.rect, this.mouse)) ?? null;
    }

    isSelected(button) {
        return button !== null && button.id === this.selectedId;
    }

    get awaitingAction() {
        return this.resolveAction !== null;
    }

    waitForAction() {
        this.selectedId = null;
        return new Promise((resolve) => {
            this.resolveAction = resolve;
        });
    }

    waitForContinue() {
        return new Promise((resolve) => {
            this.resolveContinue = resolve;
        });
    }

    continue() {
        const resolve = this.resolveContinue;
        this.resolveContinue = null;
        resolve();
    }

    trigger(button) {
        this.selectedId = null;
        if (!button?.enabled || !button.action || !this.resolveAction) return;
        const resolve = this.resolveAction;
        this.resolveAction = null;
        resolve(button.action);
    }

    handlePress(pt) {
        this.mouse = pt;
        if (this.resolveContinue) {
            this.continue();
            return;
        }
        const button = this.getButtons().find((b) => contains(b.rect, pt)) ?? null;
        if (this.isTouch && button?.itemId && !this.isSelected(button)) {
            this.selectedId = button.id;
            return;
        }
        this.trigger(button);
    }

    handleKey(e) {
        if (this.resolveContinue && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            this.continue();
            return;
        }
        const key = e.key.toUpperCase();
        this.trigger(this.getButtons().find((b) => b.hotkey === key));
    }
}
