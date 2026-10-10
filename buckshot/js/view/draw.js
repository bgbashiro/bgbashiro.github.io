import { COLORS } from '../config.js';

// Low-level canvas helpers shared by the renderer.

export function roundRect(ctx, x, y, w, h, r = 8) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

export function fillRoundRect(ctx, rect, fill, r = 8, stroke = null) {
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

export function text(ctx, str, x, y, { size = 16, color = COLORS.text, align = 'left', baseline = 'alphabetic', weight = 'normal' } = {}) {
    ctx.font = `${weight} ${size}px "Courier New", monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(str, x, y);
}

// Word-wrap `str` to `maxWidth`, using the font currently set via text()'s options.
export function wrapLines(ctx, str, maxWidth, size = 14) {
    ctx.font = `normal ${size}px "Courier New", monospace`;
    const words = str.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const attempt = line ? `${line} ${word}` : word;
        if (ctx.measureText(attempt).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = attempt;
        }
    }
    if (line) lines.push(line);
    return lines;
}

// HP shown as lightning-ish charge blocks.
export function drawCharges(ctx, x, y, hp, maxHp) {
    for (let i = 0; i < maxHp; i++) {
        const filled = i < hp;
        const cx = x + i * 26;
        ctx.fillStyle = filled ? COLORS.charge : COLORS.chargeEmpty;
        ctx.beginPath();
        ctx.moveTo(cx + 12, y);
        ctx.lineTo(cx + 2, y + 13);
        ctx.lineTo(cx + 9, y + 13);
        ctx.lineTo(cx + 6, y + 24);
        ctx.lineTo(cx + 18, y + 9);
        ctx.lineTo(cx + 11, y + 9);
        ctx.closePath();
        ctx.fill();
    }
}

// A shotgun shell standing upright. kind: 'live' | 'blank' | 'unknown'.
export function drawShell(ctx, cx, cy, size, kind) {
    const w = size;
    const h = size * 2;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const body = kind === 'live' ? COLORS.live : kind === 'blank' ? COLORS.blank : COLORS.unknown;
    fillRoundRect(ctx, { x, y, w, h: h * 0.75 }, body, 4);
    ctx.fillStyle = '#b89a4a';
    ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
    if (kind === 'unknown') {
        text(ctx, '?', cx, y + h * 0.38, { size: size * 0.9, color: COLORS.dim, align: 'center', baseline: 'middle', weight: 'bold' });
    }
}

// The shotgun, drawn pointing along +x from the origin (caller rotates).
export function drawShotgun(ctx, sawed) {
    const barrel = sawed ? 90 : 170;
    ctx.fillStyle = '#5a3a22';
    roundRect(ctx, -150, -14, 110, 28, 10);
    ctx.fill();
    ctx.fillStyle = '#2b2b2e';
    ctx.fillRect(-45, -12, 70, 24);
    ctx.fillStyle = '#3e3e44';
    ctx.fillRect(25, -9, barrel, 9);
    ctx.fillRect(25, 1, barrel, 8);
    ctx.fillStyle = '#6b4a2c';
    ctx.fillRect(40, 9, 60, 8);
    if (sawed) {
        ctx.fillStyle = '#c9c9c9';
        ctx.fillRect(25 + barrel - 2, -10, 3, 20);
    }
}

// Placeholder dealer: a pale mask with hollow eyes.
export function drawFace(ctx, x, y, r, { angry = false, hurt = 0 } = {}) {
    ctx.fillStyle = hurt > 0 ? `rgb(${217}, ${Math.round(210 - 120 * hurt)}, ${Math.round(191 - 120 * hurt)})` : COLORS.face;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = angry ? COLORS.danger : '#111';
    for (const dx of [-0.35, 0.35]) {
        ctx.beginPath();
        ctx.ellipse(x + dx * r, y - r * 0.15, r * 0.16, r * (angry ? 0.1 : 0.18), 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.35, y + r * 0.45);
    ctx.lineTo(x + r * 0.35, y + r * 0.45);
    ctx.stroke();
}
