import { COLORS } from '../config.js';
import { fillRoundRect, text } from './draw.js';

// Simple placeholder icons per item id, drawn centered in a box of size `s`.
const ICONS = {
    magnifier(ctx, cx, cy, s) {
        ctx.strokeStyle = '#9fd3ff';
        ctx.lineWidth = s * 0.08;
        ctx.beginPath();
        ctx.arc(cx - s * 0.08, cy - s * 0.08, s * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.07, cy + s * 0.07);
        ctx.lineTo(cx + s * 0.28, cy + s * 0.28);
        ctx.stroke();
    },
    cigarettes(ctx, cx, cy, s) {
        fillRoundRect(ctx, { x: cx - s * 0.2, y: cy - s * 0.25, w: s * 0.4, h: s * 0.5 }, '#c0392b', 3);
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(cx - s * 0.13, cy - s * 0.35, s * 0.08, s * 0.12);
        ctx.fillRect(cx + s * 0.03, cy - s * 0.32, s * 0.08, s * 0.09);
    },
    beer(ctx, cx, cy, s) {
        fillRoundRect(ctx, { x: cx - s * 0.16, y: cy - s * 0.28, w: s * 0.32, h: s * 0.56 }, '#3b7d3a', 4);
        ctx.fillStyle = '#e0c24a';
        ctx.fillRect(cx - s * 0.16, cy - s * 0.05, s * 0.32, s * 0.12);
    },
    handsaw(ctx, cx, cy, s) {
        ctx.fillStyle = '#b0b0b0';
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.3, cy - s * 0.1);
        ctx.lineTo(cx + s * 0.25, cy - s * 0.1);
        ctx.lineTo(cx + s * 0.25, cy + s * 0.05);
        for (let i = 0; i < 6; i++) {
            const x = cx + s * 0.25 - i * s * 0.09;
            ctx.lineTo(x - s * 0.045, cy + s * 0.13);
            ctx.lineTo(x - s * 0.09, cy + s * 0.05);
        }
        ctx.closePath();
        ctx.fill();
        fillRoundRect(ctx, { x: cx + s * 0.18, y: cy - s * 0.2, w: s * 0.16, h: s * 0.3 }, '#8b5a2b', 3);
    },
    handcuffs(ctx, cx, cy, s) {
        ctx.strokeStyle = '#c9c9c9';
        ctx.lineWidth = s * 0.07;
        for (const dx of [-0.17, 0.17]) {
            ctx.beginPath();
            ctx.arc(cx + dx * s, cy, s * 0.13, 0, Math.PI * 2);
            ctx.stroke();
        }
    },
    inverter(ctx, cx, cy, s) {
        fillRoundRect(ctx, { x: cx - s * 0.22, y: cy - s * 0.22, w: s * 0.44, h: s * 0.44 }, '#d4a017', 5);
        text(ctx, '+/-', cx, cy + 1, { size: s * 0.24, color: '#111', align: 'center', baseline: 'middle', weight: 'bold' });
    },
    phone(ctx, cx, cy, s) {
        fillRoundRect(ctx, { x: cx - s * 0.15, y: cy - s * 0.28, w: s * 0.3, h: s * 0.56 }, '#222', 4, '#666');
        ctx.fillStyle = '#5fd35f';
        ctx.fillRect(cx - s * 0.1, cy - s * 0.2, s * 0.2, s * 0.22);
    },
};

export function drawItemIcon(ctx, id, cx, cy, s) {
    const icon = ICONS[id];
    if (icon) icon(ctx, cx, cy, s);
    else text(ctx, id[0].toUpperCase(), cx, cy, { size: s * 0.5, color: COLORS.text, align: 'center', baseline: 'middle' });
}
