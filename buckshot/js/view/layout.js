import { MAX_ITEMS } from '../config.js';

// Screen positions in logical canvas pixels. Two layouts: a wide one for
// desktop/landscape and a tall one for phones in portrait. `LAYOUT` always
// holds the active one; read it at draw time, never cache its fields.

const LANDSCAPE = {
    name: 'landscape',
    width: 960,
    height: 720,
    table: { x: 30, y: 150, w: 900, h: 360 },
    dealerFace: { x: 480, y: 78, r: 52 },
    dealerHud: { x: 40, y: 30 },
    playerHud: { x: 40, y: 530 },
    roundInfo: { x: 920, y: 30 },
    shotgun: { x: 480, y: 335, scale: 1 },
    shellRow: { x: 90, y: 345, size: 18, gap: 8 },
    items: { cols: MAX_ITEMS, size: 60, gap: 10, dealerY: 168, playerY: 432 },
    shootDealer: { x: 40, y: 640, w: 200, h: 52 },
    shootSelf: { x: 256, y: 640, w: 200, h: 52 },
    log: { x: 480, y: 528, w: 450, h: 172 },
    poster: { x: 300, y: 18, w: 78, h: 104 },
};

const PORTRAIT = {
    name: 'portrait',
    width: 480,
    height: 830,
    table: { x: 12, y: 128, w: 456, h: 424 },
    dealerFace: { x: 240, y: 68, r: 42 },
    dealerHud: { x: 20, y: 30 },
    playerHud: { x: 20, y: 572 },
    roundInfo: { x: 460, y: 30 },
    shotgun: { x: 300, y: 335, scale: 0.75 },
    shellRow: { x: 24, y: 300, size: 16, gap: 7 },
    items: { cols: 4, size: 60, gap: 10, dealerY: 138, playerY: 412 },
    shootDealer: { x: 12, y: 652, w: 222, h: 56 },
    shootSelf: { x: 246, y: 652, w: 222, h: 56 },
    log: { x: 12, y: 718, w: 456, h: 104 },
    poster: null,
};

export const LAYOUT = { ...LANDSCAPE };

// Pick the layout for a viewport size. Returns true if it changed.
export function selectLayout(viewportWidth, viewportHeight) {
    const next = viewportWidth < viewportHeight ? PORTRAIT : LANDSCAPE;
    if (LAYOUT.name === next.name) return false;
    Object.assign(LAYOUT, next);
    return true;
}

export function itemSlotRect(ownerId, index) {
    const { cols, size, gap, dealerY, playerY } = LAYOUT.items;
    const rowWidth = cols * size + (cols - 1) * gap;
    const startX = LAYOUT.table.x + (LAYOUT.table.w - rowWidth) / 2;
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
        x: startX + col * (size + gap),
        y: (ownerId === 'dealer' ? dealerY : playerY) + row * (size + gap),
        w: size,
        h: size,
    };
}

export const contains = (rect, pt) =>
    pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h;
