import { CANVAS, COLORS, MAX_ITEMS } from '../config.js';
import { drawCharges, drawFace, drawShell, drawShotgun, fillRoundRect, text, wrapLines } from './draw.js';
import { drawItemIcon } from './icons.js';
import { LAYOUT, itemSlotRect } from './layout.js';

// Draws the whole scene from game + view state. Holds no game logic.
export class Renderer {
    constructor(canvas, { game, view, log, fx, input, getButtons }) {
        this.ctx = canvas.getContext('2d');
        Object.assign(this, { canvas, game, view, log, fx, input, getButtons });
        this.gunAngle = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = CANVAS.width * dpr;
        this.canvas.height = CANVAS.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    render(t) {
        const { ctx } = this;
        const buttons = this.getButtons();
        const hovered = this.input.hoveredButton();
        this.gunAngle += (this.fx.aimAngle - this.gunAngle) * 0.18;

        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

        const shake = this.fx.shakeOffset(t);
        ctx.save();
        ctx.translate(shake.x, shake.y);
        this.drawTable();
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
        else if (hovered) this.drawTooltip(hovered.tooltip);
    }

    drawTable() {
        fillRoundRect(this.ctx, LAYOUT.table, COLORS.table, 18, COLORS.tableEdge);
    }

    drawDealer(t) {
        const { x, y, r } = LAYOUT.dealerFace;
        const hurt = Math.max(0, (this.fx.dealerHurtUntil - t) / 600);
        drawFace(this.ctx, x, y, r, { angry: this.view.phase === 'dealerTurn', hurt });
    }

    drawHud() {
        const { ctx, game, view } = this;
        const label = (who, pos) => {
            text(ctx, who.isPlayer ? 'YOU' : 'DEALER', pos.x, pos.y, { size: 18, weight: 'bold' });
            drawCharges(ctx, pos.x, pos.y + 10, who.hp, who.maxHp);
            if (who.cuffed) text(ctx, 'CUFFED', pos.x, pos.y + 56, { size: 14, color: COLORS.danger, weight: 'bold' });
            if (game.current === who && ['playerTurn', 'dealerTurn', 'busy'].includes(view.phase)) {
                text(ctx, '< TURN', pos.x + 110, pos.y, { size: 14, color: COLORS.accent, weight: 'bold' });
            }
        };
        label(game.dealer, LAYOUT.dealerHud);
        label(game.player, LAYOUT.playerHud);

        const { x, y } = LAYOUT.roundInfo;
        text(ctx, `ROUND ${game.roundIndex + 1}`, x, y, { size: 18, align: 'right', weight: 'bold' });
        if (game.lastLoad) {
            const { live, blank } = game.lastLoad;
            text(ctx, `loaded: ${live} live / ${blank} blank`, x, y + 24, { size: 14, color: COLORS.dim, align: 'right' });
        }
    }

    drawItemSlots(buttons, hovered) {
        const { ctx } = this;
        for (const owner of ['dealer', 'player']) {
            for (let i = 0; i < MAX_ITEMS; i++) fillRoundRect(ctx, itemSlotRect(owner, i), COLORS.slot, 8);
        }
        for (const b of buttons.filter((b) => b.itemId)) {
            const usable = b.enabled;
            const fill = b === hovered && usable ? COLORS.buttonHover : COLORS.button;
            fillRoundRect(ctx, b.rect, fill, 8, usable ? COLORS.accent : null);
            ctx.globalAlpha = b.owner === 'player' && !usable && this.view.phase === 'playerTurn' ? 0.4 : 1;
            drawItemIcon(ctx, b.itemId, b.rect.x + b.rect.w / 2, b.rect.y + b.rect.h / 2, b.rect.w);
            ctx.globalAlpha = 1;
            if (b.hotkey) text(ctx, b.hotkey, b.rect.x + 5, b.rect.y + 14, { size: 11, color: COLORS.dim });
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
        const scale = 1 - 0.3 * Math.abs(Math.sin(this.gunAngle));
        ctx.scale(scale, scale);
        drawShotgun(ctx, this.game.shotgun.sawed);
        ctx.restore();
        if (this.game.shotgun.sawed) {
            text(ctx, 'SAWED OFF: x2 DAMAGE', x + 140, y + 70, { size: 13, color: COLORS.danger, align: 'center', weight: 'bold' });
        }
    }

    drawActionButtons(buttons, hovered) {
        for (const b of buttons.filter((b) => b.label)) {
            const fill = !b.enabled ? COLORS.buttonDisabled : b === hovered ? COLORS.buttonHover : COLORS.button;
            fillRoundRect(this.ctx, b.rect, fill, 8, b.enabled ? COLORS.accent : '#333');
            text(this.ctx, b.label, b.rect.x + b.rect.w / 2, b.rect.y + b.rect.h / 2 + 1, {
                size: 18, align: 'center', baseline: 'middle', weight: 'bold',
                color: b.enabled ? COLORS.text : COLORS.dim,
            });
            text(this.ctx, `[${b.hotkey}]`, b.rect.x + b.rect.w - 8, b.rect.y + 14, { size: 11, color: COLORS.dim, align: 'right' });
        }
        if (this.view.phase === 'playerTurn') {
            text(this.ctx, 'Your move. Use items, then shoot.', LAYOUT.shootDealer.x, LAYOUT.shootDealer.y - 14, { size: 14, color: COLORS.accent });
        } else if (this.view.phase === 'dealerTurn') {
            text(this.ctx, 'The dealer is thinking...', LAYOUT.shootDealer.x, LAYOUT.shootDealer.y - 14, { size: 14, color: COLORS.dim });
        }
    }

    drawLog() {
        const { ctx } = this;
        const box = LAYOUT.log;
        fillRoundRect(ctx, box, '#151513', 8, '#2a2824');
        const lineHeight = 18;
        const maxLines = Math.floor((box.h - 16) / lineHeight);
        const lines = [];
        for (const entry of this.log.entries) {
            for (const line of wrapLines(ctx, entry.text, box.w - 24, 14)) lines.push({ line, entry });
        }
        const visible = lines.slice(-maxLines);
        visible.forEach(({ line, entry }, i) => {
            const age = visible.length - 1 - i;
            ctx.globalAlpha = Math.max(0.35, 1 - age * 0.08);
            text(ctx, line, box.x + 12, box.y + 22 + i * lineHeight, { size: 14, color: entry.color ?? COLORS.text });
        });
        ctx.globalAlpha = 1;
    }

    drawFloaters(t) {
        for (const f of this.fx.floaters) {
            const p = (t - f.start) / f.duration;
            this.ctx.globalAlpha = 1 - p;
            text(this.ctx, f.str, f.x, f.y - p * 40, { size: 32, color: f.color, align: 'center', weight: 'bold' });
        }
        this.ctx.globalAlpha = 1;
    }

    drawFlashes(t) {
        for (const f of this.fx.flashes) {
            this.ctx.globalAlpha = 0.7 * (1 - (t - f.start) / f.duration);
            this.ctx.fillStyle = f.color;
            this.ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
        }
        this.ctx.globalAlpha = 1;
    }

    drawLoadPreview() {
        const { ctx } = this;
        const { live, blank } = this.view.loadPreview;
        const box = { x: 230, y: 250, w: 500, h: 160 };
        fillRoundRect(ctx, box, 'rgba(0,0,0,0.85)', 12, COLORS.accent);
        text(ctx, `${live} LIVE  /  ${blank} BLANK`, box.x + box.w / 2, box.y + 36, { size: 24, align: 'center', weight: 'bold' });
        const kinds = [...Array(live).fill('live'), ...Array(blank).fill('blank')];
        const size = 22;
        const gap = 14;
        const width = kinds.length * size + (kinds.length - 1) * gap;
        kinds.forEach((kind, i) => {
            drawShell(ctx, box.x + box.w / 2 - width / 2 + size / 2 + i * (size + gap), box.y + 95, size, kind);
        });
        text(ctx, 'The shells are shuffled into the gun...', box.x + box.w / 2, box.y + 148, { size: 13, color: COLORS.dim, align: 'center' });
    }

    drawOverlay(t) {
        const { ctx } = this;
        const { title, subtitle, prompt } = this.view.overlay;
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
        const cx = CANVAS.width / 2;
        text(ctx, title, cx, 300, { size: 52, align: 'center', weight: 'bold', color: COLORS.accent });
        (Array.isArray(subtitle) ? subtitle : [subtitle]).filter(Boolean).forEach((line, i) => {
            text(ctx, line, cx, 350 + i * 26, { size: 18, align: 'center' });
        });
        if (prompt) {
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t / 300);
            text(ctx, prompt, cx, 520, { size: 18, align: 'center', color: COLORS.dim });
            ctx.globalAlpha = 1;
        }
    }

    drawTooltip(tip) {
        if (!tip) return;
        const { ctx } = this;
        const lines = wrapLines(ctx, tip, 260, 13);
        const w = 280;
        const h = lines.length * 17 + 12;
        const x = Math.min(this.input.mouse.x + 14, CANVAS.width - w - 4);
        const y = Math.max(4, this.input.mouse.y - h - 10);
        fillRoundRect(ctx, { x, y, w, h }, 'rgba(20,20,18,0.95)', 6, COLORS.dim);
        lines.forEach((line, i) => text(ctx, line, x + 10, y + 19 + i * 17, { size: 13 }));
    }
}
