import { Controller } from './controller.js';
import { Input } from './input.js';
import { Game } from './model/game.js';
import { Effects } from './view/effects.js';
import { MessageLog } from './view/messageLog.js';
import { Renderer } from './view/renderer.js';
import { FONTS } from './view/theme.js';
import { buildButtons } from './view/ui.js';

const canvas = document.getElementById('game');

// Canvas text doesn't trigger web-font downloads on its own; request them up
// front. The render loop redraws every frame, so they appear once loaded.
document.fonts?.load(`20px ${FONTS.display}`);
document.fonts?.load(`20px ${FONTS.body}`);

const game = new Game();
const view = { phase: 'title', overlay: null, loadPreview: null };
const log = new MessageLog();
const fx = new Effects();
const getButtons = () => buildButtons(game, view);
const input = new Input(canvas, getButtons);
const renderer = new Renderer(canvas, { game, view, log, fx, input, getButtons });
const controller = new Controller({ game, view, log, fx, input });

function frame(t) {
    fx.update(t);
    renderer.render(t);
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
controller.run();
