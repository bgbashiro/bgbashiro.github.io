import { COLORS } from './theme.js';
import { fillRoundRect, roundRect, text } from './draw.js';

// Placeholder frontier icons per item id, drawn centered in a box of size `s`
// on a parchment card. Item names/descriptions live in model/items.js.
const ICONS = {
    // Spyglass
    magnifier(ctx, cx, cy, s) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.6);
        const segs = [[-0.3, 0.1, '#7a5a24'], [-0.12, 0.13, COLORS.brass], [0.08, 0.16, '#b08a36']];
        for (const [x0, h, c] of segs) {
            ctx.fillStyle = c;
            ctx.fillRect(x0 * s, -h * s / 2, 0.22 * s, h * s);
        }
        ctx.fillStyle = '#2a1a0c';
        ctx.fillRect(0.28 * s, -0.09 * s, 0.04 * s, 0.18 * s);
        ctx.restore();
    },
    // Cigar
    cigarettes(ctx, cx, cy, s) {
        fillRoundRect(ctx, { x: cx - s * 0.3, y: cy - s * 0.06, w: s * 0.52, h: s * 0.13 }, '#6b3f1d', s * 0.06);
        ctx.fillStyle = '#b8322a';
        ctx.fillRect(cx - s * 0.12, cy - s * 0.06, s * 0.07, s * 0.13);
        ctx.fillStyle = '#ff8a3a';
        ctx.fillRect(cx + s * 0.2, cy - s * 0.05, s * 0.05, s * 0.11);
        ctx.strokeStyle = 'rgba(90,80,70,0.6)';
        ctx.lineWidth = s * 0.03;
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.25, cy - s * 0.08);
        ctx.quadraticCurveTo(cx + s * 0.32, cy - s * 0.18, cx + s * 0.24, cy - s * 0.28);
        ctx.stroke();
    },
    // Whiskey bottle
    beer(ctx, cx, cy, s) {
        ctx.fillStyle = '#8a4a12';
        roundRect(ctx, cx - s * 0.14, cy - s * 0.12, s * 0.28, s * 0.42, s * 0.05);
        ctx.fill();
        ctx.fillRect(cx - s * 0.05, cy - s * 0.32, s * 0.1, s * 0.22);
        ctx.fillStyle = '#3a2614';
        ctx.fillRect(cx - s * 0.06, cy - s * 0.36, s * 0.12, s * 0.06);
        ctx.fillStyle = COLORS.paper;
        ctx.fillRect(cx - s * 0.12, cy + s * 0.0, s * 0.24, s * 0.14);
        text(ctx, 'XXX', cx, cy + s * 0.075, { size: s * 0.11, color: COLORS.ink, align: 'center', baseline: 'middle', font: 'display' });
    },
    // Hacksaw
    handsaw(ctx, cx, cy, s) {
        ctx.fillStyle = '#6d6d70';
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.32, cy - s * 0.1);
        ctx.lineTo(cx + s * 0.2, cy - s * 0.1);
        ctx.lineTo(cx + s * 0.2, cy + s * 0.05);
        for (let i = 0; i < 6; i++) {
            const x = cx + s * 0.2 - i * s * 0.09;
            ctx.lineTo(x - s * 0.045, cy + s * 0.13);
            ctx.lineTo(x - s * 0.09, cy + s * 0.05);
        }
        ctx.closePath();
        ctx.fill();
        fillRoundRect(ctx, { x: cx + s * 0.16, y: cy - s * 0.2, w: s * 0.16, h: s * 0.32 }, '#6b3f1d', 3);
    },
    // Lasso
    handcuffs(ctx, cx, cy, s) {
        ctx.strokeStyle = '#9c7a3c';
        ctx.lineWidth = s * 0.06;
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.04, cy - s * 0.04, s * 0.22, s * 0.17, -0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.12, cy + s * 0.1);
        ctx.quadraticCurveTo(cx + s * 0.3, cy + s * 0.18, cx + s * 0.18, cy + s * 0.32);
        ctx.stroke();
    },
    // Two-headed coin
    inverter(ctx, cx, cy, s) {
        ctx.fillStyle = COLORS.brass;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a6a1e';
        ctx.lineWidth = s * 0.03;
        ctx.stroke();
        text(ctx, '+/-', cx, cy + 1, { size: s * 0.2, color: COLORS.ink, align: 'center', baseline: 'middle', font: 'display' });
    },
    // Telegram
    phone(ctx, cx, cy, s) {
        ctx.fillStyle = '#f7efd9';
        ctx.fillRect(cx - s * 0.26, cy - s * 0.18, s * 0.52, s * 0.36);
        ctx.strokeStyle = COLORS.inkDim;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - s * 0.26, cy - s * 0.18, s * 0.52, s * 0.36);
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.26, cy - s * 0.18);
        ctx.lineTo(cx, cy + s * 0.02);
        ctx.lineTo(cx + s * 0.26, cy - s * 0.18);
        ctx.stroke();
        ctx.fillStyle = '#9c1f17';
        ctx.beginPath();
        ctx.arc(cx, cy + s * 0.02, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
    },
};

export function drawItemIcon(ctx, id, cx, cy, s) {
    const icon = ICONS[id];
    if (icon) icon(ctx, cx, cy, s);
    else text(ctx, id[0].toUpperCase(), cx, cy, { size: s * 0.5, color: COLORS.ink, align: 'center', baseline: 'middle', font: 'display' });
}
