import { CANVAS } from './config.js';
import { contains } from './view/layout.js';

// Turns pointer/keyboard events into game actions. The controller awaits
// waitForAction() / waitForContinue(); everything else is ignored.
export class Input {
    constructor(canvas, getButtons) {
        this.canvas = canvas;
        this.getButtons = getButtons;
        this.mouse = { x: -1, y: -1 };
        this.resolveAction = null;
        this.resolveContinue = null;

        canvas.addEventListener('pointermove', (e) => {
            this.mouse = this.toCanvas(e);
        });
        canvas.addEventListener('pointerleave', () => {
            this.mouse = { x: -1, y: -1 };
        });
        canvas.addEventListener('pointerdown', (e) => this.handlePress(this.toCanvas(e)));
        window.addEventListener('keydown', (e) => this.handleKey(e));
    }

    toCanvas(e) {
        const r = this.canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - r.left) * CANVAS.width) / r.width,
            y: ((e.clientY - r.top) * CANVAS.height) / r.height,
        };
    }

    hoveredButton() {
        return this.getButtons().find((b) => contains(b.rect, this.mouse)) ?? null;
    }

    get awaitingAction() {
        return this.resolveAction !== null;
    }

    waitForAction() {
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
        this.trigger(this.getButtons().find((b) => contains(b.rect, pt)));
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
