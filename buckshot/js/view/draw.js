import { COLORS, FONTS } from './theme.js';

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

export function fillRoundRect(ctx, rect, fill, r = 8, stroke = null, lineWidth = 2) {
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}

const fontString = (size, font, weight) => `${weight} ${size}px ${FONTS[font] ?? font}`;

// font: 'body' | 'display' (see theme.js) or any CSS font family.
export function text(ctx, str, x, y, { size = 16, color = COLORS.text, align = 'left', baseline = 'alphabetic', weight = 'normal', font = 'body' } = {}) {
    ctx.font = fontString(size, font, weight);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(str, x, y);
}

// Largest font size (up to `max`) at which `str` fits in `maxWidth`.
export function fitTextSize(ctx, str, maxWidth, max, font = 'display') {
    ctx.font = fontString(max, font, 'normal');
    const width = ctx.measureText(str).width;
    return width <= maxWidth ? max : Math.floor((max * maxWidth) / width);
}

export function wrapLines(ctx, str, maxWidth, size = 14, font = 'body') {
    ctx.font = fontString(size, font, 'normal');
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

// A sheet of parchment: used for the log, posters, tooltips and cards.
export function drawParchment(ctx, rect, { fill = COLORS.paper, r = 6 } = {}) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    fillRoundRect(ctx, rect, fill, r);
    ctx.restore();
    roundRect(ctx, rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8, Math.max(2, r - 3));
    ctx.strokeStyle = COLORS.paperEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

// A nailed wooden signboard: used for the action buttons.
export function drawSignboard(ctx, rect, fill) {
    fillRoundRect(ctx, rect, fill, 6, COLORS.woodEdge, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (const f of [0.33, 0.66]) {
        ctx.beginPath();
        ctx.moveTo(rect.x + 8, rect.y + rect.h * f);
        ctx.lineTo(rect.x + rect.w - 8, rect.y + rect.h * f);
        ctx.stroke();
    }
    ctx.fillStyle = COLORS.nail;
    for (const [nx, ny] of [[8, 8], [rect.w - 8, 8], [8, rect.h - 8], [rect.w - 8, rect.h - 8]]) {
        ctx.beginPath();
        ctx.arc(rect.x + nx, rect.y + ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function starPath(ctx, cx, cy, outer, inner, points = 5) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 ? inner : outer;
        const a = -Math.PI / 2 + (i * Math.PI) / points;
        ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    }
    ctx.closePath();
}

// HP shown as sheriff stars.
export function drawCharges(ctx, x, y, hp, maxHp) {
    for (let i = 0; i < maxHp; i++) {
        const cx = x + 12 + i * 26;
        const cy = y + 12;
        starPath(ctx, cx, cy, 12, 5.5);
        ctx.fillStyle = i < hp ? COLORS.charge : COLORS.chargeEmpty;
        ctx.fill();
        if (i < hp) {
            ctx.strokeStyle = '#8a6a1e';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#8a6a1e';
            ctx.beginPath();
            ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
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
    ctx.fillStyle = COLORS.brass;
    ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, y + h * 0.76, w, 2);
    if (kind === 'unknown') {
        text(ctx, '?', cx, y + h * 0.38, { size: size * 0.9, color: COLORS.dim, align: 'center', baseline: 'middle', font: 'display' });
    }
}

// Double-barrel coach gun, drawn pointing along +x from the origin (caller rotates).
export function drawShotgun(ctx, sawed) {
    const barrel = sawed ? 90 : 170;
    // Stock with a darker grip and a brass butt plate.
    ctx.fillStyle = COLORS.rim;
    ctx.beginPath();
    ctx.moveTo(-150, -16);
    ctx.lineTo(-45, -10);
    ctx.lineTo(-45, 12);
    ctx.lineTo(-150, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.rimDark;
    ctx.fillRect(-75, -9, 30, 20);
    ctx.fillStyle = COLORS.brass;
    ctx.fillRect(-154, -16, 6, 34);
    // Receiver with engraving.
    ctx.fillStyle = '#5c5a55';
    roundRect(ctx, -45, -12, 70, 24, 4);
    ctx.fill();
    ctx.strokeStyle = COLORS.brass;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-10, 0, 6, 0, Math.PI * 2);
    ctx.stroke();
    // Barrels and fore-end.
    ctx.fillStyle = '#3a3a40';
    ctx.fillRect(25, -9, barrel, 8);
    ctx.fillRect(25, 1, barrel, 8);
    ctx.fillStyle = COLORS.rimLight;
    ctx.fillRect(35, 9, 60, 7);
    ctx.fillStyle = COLORS.brass;
    ctx.fillRect(25 + barrel - 6, -10, 4, 20);
    if (sawed) {
        ctx.fillStyle = '#d9d2bf';
        ctx.fillRect(25 + barrel - 1, -10, 3, 20);
    }
}

// Placeholder dealer: an outlaw in a wide-brim hat with a handlebar mustache.
export function drawFace(ctx, x, y, r, { angry = false, hurt = 0 } = {}) {
    // Head
    const g = Math.round(165 - 90 * hurt);
    ctx.fillStyle = hurt > 0 ? `rgb(214, ${g}, ${Math.round(122 - 70 * hurt)})` : COLORS.skin;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.1, r * 0.72, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hat: crown then brim, sitting low over the eyes.
    ctx.fillStyle = COLORS.hat;
    roundRect(ctx, x - r * 0.55, y - r * 1.25, r * 1.1, r * 0.75, r * 0.25);
    ctx.fill();
    ctx.fillStyle = COLORS.hatBand;
    ctx.fillRect(x - r * 0.55, y - r * 0.68, r * 1.1, r * 0.14);
    ctx.fillStyle = COLORS.hat;
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.5, r * 1.25, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes in the hat's shadow; red glint when it's the dealer's move.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x - r * 0.68, y - r * 0.32, r * 1.36, r * 0.22);
    ctx.fillStyle = angry ? COLORS.danger : '#111';
    for (const dx of [-0.28, 0.28]) {
        ctx.beginPath();
        ctx.ellipse(x + dx * r, y - r * 0.1, r * 0.12, r * (angry ? 0.05 : 0.08), 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Handlebar mustache and a thin mouth.
    ctx.fillStyle = COLORS.mustache;
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.28);
    ctx.quadraticCurveTo(x - r * 0.35, y + r * 0.18, x - r * 0.55, y + r * 0.45);
    ctx.quadraticCurveTo(x - r * 0.3, y + r * 0.38, x, y + r * 0.42);
    ctx.quadraticCurveTo(x + r * 0.3, y + r * 0.38, x + r * 0.55, y + r * 0.45);
    ctx.quadraticCurveTo(x + r * 0.35, y + r * 0.18, x, y + r * 0.28);
    ctx.fill();
    ctx.strokeStyle = '#3a2414';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.18, y + r * 0.58);
    ctx.lineTo(x + r * 0.18, y + r * 0.58);
    ctx.stroke();
}

// Saloon wall: vertical planks with a couple of warm lamp glows.
export function drawBackdrop(ctx, width, height) {
    const plank = 48;
    for (let x = 0, i = 0; x < width; x += plank, i++) {
        ctx.fillStyle = i % 2 ? COLORS.wallPlank : COLORS.wallPlankAlt;
        ctx.fillRect(x, 0, plank, height);
        ctx.fillStyle = COLORS.wallSeam;
        ctx.fillRect(x, 0, 2, height);
    }
    for (const lx of [width * 0.12, width * 0.88]) {
        const glow = ctx.createRadialGradient(lx, 40, 5, lx, 40, 220);
        glow.addColorStop(0, COLORS.lampGlow);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
    }
    // Darken the edges so the table reads as the focus.
    const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
}

// Card table: wooden rim around green felt.
export function drawTable(ctx, rect) {
    fillRoundRect(ctx, rect, COLORS.rim, 22, COLORS.rimDark, 3);
    roundRect(ctx, rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6, 20);
    ctx.strokeStyle = COLORS.rimLight;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const inset = 14;
    fillRoundRect(ctx, { x: rect.x + inset, y: rect.y + inset, w: rect.w - inset * 2, h: rect.h - inset * 2 }, COLORS.felt, 12, COLORS.rimDark, 2);
}

// Small WANTED poster pinned to the wall.
export function drawWantedPoster(ctx, rect) {
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(-0.05);
    const local = { x: -rect.w / 2, y: -rect.h / 2, w: rect.w, h: rect.h };
    drawParchment(ctx, local, { r: 2 });
    text(ctx, 'WANTED', 0, local.y + 20, { size: 13, color: COLORS.ink, align: 'center', font: 'display' });
    ctx.fillStyle = COLORS.inkDim;
    ctx.beginPath();
    ctx.arc(0, local.y + 46, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-8, local.y + 28, 16, 5);
    ctx.fillRect(-16, local.y + 32, 32, 3);
    text(ctx, '$500', 0, local.y + rect.h - 12, { size: 13, color: COLORS.ink, align: 'center', font: 'display' });
    ctx.restore();
    ctx.fillStyle = COLORS.nail;
    ctx.beginPath();
    ctx.arc(rect.x + rect.w / 2, rect.y + 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
}
