import { MAX_ITEMS } from '../config.js';
import {
    drawBackdrop, drawCharges, drawFace, drawParchment, drawShell, drawShotgun, drawSignboard,
    drawTable, drawWantedPoster, fillRoundRect, fitTextSize, text, wrapLines,
} from './draw.js';
import { drawItemIcon } from './icons.js';
import { LAYOUT, itemSlotRect, selectLayout } from './layout.js';
import { COLORS, LOG_INK } from './theme.js';

// Draws the whole scene from game + view state. Holds no game logic.
export class Renderer {
    constructor(canvas, { game, view, log, fx, input, getButtons }) {
        this.ctx = canvas.getContext('2d');
        Object.assign(this, { canvas, game, view, log, fx, input, getButtons });
        this.gunAngle = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    // Pick portrait/landscape for the viewport and size the backing store.
    resize() {
        selectLayout(window.innerWidth, window.innerHeight);
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = LAYOUT.width * dpr;
        this.canvas.height = LAYOUT.height * dpr;
        this.canvas.style.setProperty('--aspect', `${LAYOUT.width / LAYOUT.height}`);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    render(t) {
        const { ctx } = this;
        const buttons = this.getButtons();
        const hovered = this.input.hoveredButton();
        this.gunAngle += (this.fx.aimAngle - this.gunAngle) * 0.18;

        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, LAYOUT.width, LAYOUT.height);

        const shake = this.fx.shakeOffset(t);
        ctx.save();
        ctx.translate(shake.x, shake.y);
        drawBackdrop(ctx, LAYOUT.width, LAYOUT.height);
        if (LAYOUT.poster) drawWantedPoster(ctx, LAYOUT.poster);
        drawTable(ctx, LAYOUT.table);
        this.drawDealer(t);
        this.drawHud();
        this.drawItemSlots(buttons, hovered);
        this.drawShellRow();
        this.drawGun();
        this.drawActionButtons(buttons, hovered);
        this.drawLog();
        ctx.restore();

        this.drawFloaters(t);
        this.drawFlashes(t);
        if (this.view.loadPreview) this.drawLoadPreview();
        if (this.view.overlay) this.drawOverlay(t);
        else if (hovered) this.drawTooltip(hovered);
    }

    drawDealer(t) {
        const { x, y, r } = LAYOUT.dealerFace;
        const hurt = Math.max(0, (this.fx.dealerHurtUntil - t) / 600);
        drawFace(this.ctx, x, y, r, { angry: this.view.phase === 'dealerTurn', hurt });
    }

    drawHud() {
        const { ctx, game, view } = this;
        const label = (who, pos) => {
            text(ctx, who.isPlayer ? 'YOU' : 'DEALER', pos.x, pos.y, { size: 18, font: 'display' });
            drawCharges(ctx, pos.x, pos.y + 10, who.hp, who.maxHp);
            if (who.cuffed) text(ctx, 'ROPED', pos.x, pos.y + 56, { size: 15, color: COLORS.danger, font: 'display' });
            if (game.current === who && ['playerTurn', 'dealerTurn', 'busy'].includes(view.phase)) {
                text(ctx, '< TURN', pos.x + 110, pos.y, { size: 14, color: COLORS.accent, font: 'display' });
            }
        };
        label(game.dealer, LAYOUT.dealerHud);
        label(game.player, LAYOUT.playerHud);

        const { x, y } = LAYOUT.roundInfo;
        text(ctx, `ROUND ${game.roundIndex + 1}`, x, y, { size: 18, align: 'right', font: 'display' });
        if (game.lastLoad) {
            const { live, blank } = game.lastLoad;
            text(ctx, `${live} live / ${blank} blank`, x, y + 24, { size: 14, color: COLORS.dim, align: 'right' });
        }
    }

    // Empty slots are felt hollows; items are parchment cards.
    drawItemSlots(buttons, hovered) {
        const { ctx } = this;
        for (const owner of ['dealer', 'player']) {
            for (let i = 0; i < MAX_ITEMS; i++) fillRoundRect(ctx, itemSlotRect(owner, i), COLORS.feltDark, 8);
        }
        for (const b of buttons.filter((b) => b.itemId)) {
            const usable = b.enabled;
            drawParchment(ctx, b.rect, { fill: b.id === hovered?.id ? COLORS.paperHover : COLORS.paper });
            if (usable) fillRoundRect(ctx, b.rect, 'rgba(0,0,0,0)', 6, COLORS.accent, 3);
            ctx.globalAlpha = b.owner === 'player' && !usable && this.view.phase === 'playerTurn' ? 0.4 : 1;
            drawItemIcon(ctx, b.itemId, b.rect.x + b.rect.w / 2, b.rect.y + b.rect.h / 2, b.rect.w);
            ctx.globalAlpha = 1;
            if (b.hotkey) text(ctx, b.hotkey, b.rect.x + 8, b.rect.y + 17, { size: 11, color: COLORS.inkDim });
        }
    }

    // One slot per remaining shell; the player sees types only for shells they know.
    drawShellRow() {
        const { shells } = this.game.shotgun;
        if (!shells.length) return;
        const { x, y, size, gap } = LAYOUT.shellRow;
        const startX = x + size / 2;
        shells.forEach((shell, i) => {
            const kind = shell.knownBy.has('player') ? (shell.live ? 'live' : 'blank') : 'unknown';
            drawShell(this.ctx, startX + i * (size + gap), y, size, kind);
        });
        text(this.ctx, 'chamber', startX - size / 2, y + size + 14, { size: 11, color: COLORS.dim });
    }

    drawGun() {
        const { ctx } = this;
        const { x, y } = LAYOUT.shotgun;
        ctx.save();
        ctx.translate(x, y + 25);
        ctx.rotate(this.gunAngle);
        // Shrink while aimed so the gun doesn't sweep over the item rows.
        const scale = LAYOUT.shotgun.scale * (1 - 0.3 * Math.abs(Math.sin(this.gunAngle)));
        ctx.scale(scale, scale);
        drawShotgun(ctx, this.game.shotgun.sawed);
        ctx.restore();
        if (this.game.shotgun.sawed) {
            const row = LAYOUT.shellRow;
            text(ctx, 'SAWED OFF: x2 DAMAGE', row.x, row.y + row.size + 34, { size: 13, color: COLORS.danger, font: 'display' });
        }
    }

    drawActionButtons(buttons, hovered) {
        for (const b of buttons.filter((b) => b.label)) {
            const fill = !b.enabled ? COLORS.woodDisabled : b.id === hovered?.id ? COLORS.woodHover : COLORS.wood;
            drawSignboard(this.ctx, b.rect, fill);
            const size = fitTextSize(this.ctx, b.label, b.rect.w - 36, 18);
            text(this.ctx, b.label, b.rect.x + b.rect.w / 2, b.rect.y + b.rect.h / 2 + 2, {
                size, align: 'center', baseline: 'middle', font: 'display',
                color: b.enabled ? COLORS.text : COLORS.dim,
            });
            text(this.ctx, `[${b.hotkey}]`, b.rect.x + b.rect.w - 14, b.rect.y + b.rect.h - 8, { size: 10, color: COLORS.nail, align: 'right' });
        }
        const hint = { x: LAYOUT.shootDealer.x, y: LAYOUT.shootDealer.y - 14 };
        if (this.view.phase === 'playerTurn') {
            text(this.ctx, 'Your draw. Use items, then shoot.', hint.x, hint.y, { size: 14, color: COLORS.accent });
        } else if (this.view.phase === 'dealerTurn') {
            text(this.ctx, 'The dealer is sizing you up...', hint.x, hint.y, { size: 14, color: COLORS.dim });
        }
    }

    drawLog() {
        const { ctx } = this;
        const box = LAYOUT.log;
        drawParchment(ctx, box);
        const lineHeight = 18;
        const maxLines = Math.floor((box.h - 16) / lineHeight);
        const lines = [];
        for (const entry of this.log.entries) {
            for (const line of wrapLines(ctx, entry.text, box.w - 28, 14)) lines.push({ line, entry });
        }
        const visible = lines.slice(-maxLines);
        visible.forEach(({ line, entry }, i) => {
            const age = visible.length - 1 - i;
            ctx.globalAlpha = Math.max(0.45, 1 - age * 0.08);
            text(ctx, line, box.x + 14, box.y + 22 + i * lineHeight, { size: 14, color: LOG_INK[entry.tag] ?? LOG_INK.default });
        });
        ctx.globalAlpha = 1;
    }

    drawFloaters(t) {
        for (const f of this.fx.floaters) {
            const p = (t - f.start) / f.duration;
            this.ctx.globalAlpha = 1 - p;
            text(this.ctx, f.str, f.x, f.y - p * 40, { size: 32, color: f.color, align: 'center', font: 'display' });
        }
        this.ctx.globalAlpha = 1;
    }

    drawFlashes(t) {
        for (const f of this.fx.flashes) {
            this.ctx.globalAlpha = 0.7 * (1 - (t - f.start) / f.duration);
            this.ctx.fillStyle = f.color;
            this.ctx.fillRect(0, 0, LAYOUT.width, LAYOUT.height);
        }
        this.ctx.globalAlpha = 1;
    }

    drawLoadPreview() {
        const { ctx } = this;
        const { live, blank } = this.view.loadPreview;
        const { table } = LAYOUT;
        const w = Math.min(500, table.w - 40);
        const box = { x: table.x + (table.w - w) / 2, y: table.y + table.h / 2 - 80, w, h: 160 };
        drawParchment(ctx, box);
        text(ctx, `${live} LIVE  /  ${blank} BLANK`, box.x + box.w / 2, box.y + 38, { size: 24, align: 'center', color: COLORS.ink, font: 'display' });
        const kinds = [...Array(live).fill('live'), ...Array(blank).fill('blank')];
        const size = 22;
        const gap = 14;
        const width = kinds.length * size + (kinds.length - 1) * gap;
        kinds.forEach((kind, i) => {
            drawShell(ctx, box.x + box.w / 2 - width / 2 + size / 2 + i * (size + gap), box.y + 92, size, kind);
        });
        text(ctx, 'The shells are shuffled into the gun...', box.x + box.w / 2, box.y + 145, { size: 13, color: COLORS.inkDim, align: 'center' });
    }

    // Banners are drawn as a big wanted-style poster.
    drawOverlay(t) {
        const { ctx } = this;
        const { title, subtitle, prompt } = this.view.overlay;
        ctx.fillStyle = 'rgba(10,5,2,0.72)';
        ctx.fillRect(0, 0, LAYOUT.width, LAYOUT.height);

        const w = Math.min(620, LAYOUT.width - 32);
        const inner = w - 48;
        const titleSize = fitTextSize(ctx, title, inner, 48);
        const lines = (Array.isArray(subtitle) ? subtitle : [subtitle])
            .filter(Boolean)
            .flatMap((para) => wrapLines(ctx, para, inner, 17));
        const h = 70 + titleSize + lines.length * 25 + (prompt ? 60 : 20);
        const box = { x: (LAYOUT.width - w) / 2, y: (LAYOUT.height - h) / 2, w, h };
        drawParchment(ctx, box, { r: 4 });

        const cx = LAYOUT.width / 2;
        let y = box.y + 40 + titleSize * 0.8;
        text(ctx, title, cx, y, { size: titleSize, align: 'center', color: '#7a1c12', font: 'display' });
        ctx.fillStyle = COLORS.paperEdge;
        ctx.fillRect(box.x + 40, y + 14, w - 80, 2);
        y += 44;
        for (const line of lines) {
            text(ctx, line, cx, y, { size: 17, align: 'center', color: COLORS.ink });
            y += 25;
        }
        if (prompt) {
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t / 300);
            const tapPrompt = this.input.isTouch ? 'Tap to continue' : prompt;
            text(ctx, tapPrompt, cx, box.y + box.h - 24, { size: 15, align: 'center', color: COLORS.inkDim });
            ctx.globalAlpha = 1;
        }
    }

    // Tooltip anchored above the button (below it if there's no room).
    drawTooltip(button) {
        if (!button.tooltip) return;
        const { ctx } = this;
        const tip = this.input.isSelected(button) && button.enabled ? `${button.tooltip} Tap again to use.` : button.tooltip;
        const w = Math.min(280, LAYOUT.width - 8);
        const lines = wrapLines(ctx, tip, w - 24, 13);
        const h = lines.length * 17 + 16;
        const { rect } = button;
        const x = Math.max(4, Math.min(rect.x + rect.w / 2 - w / 2, LAYOUT.width - w - 4));
        const y = rect.y - h - 6 >= 4 ? rect.y - h - 6 : rect.y + rect.h + 6;
        drawParchment(ctx, { x, y, w, h }, { r: 4 });
        lines.forEach((line, i) => text(ctx, line, x + 12, y + 21 + i * 17, { size: 13, color: COLORS.ink }));
    }
}
