import { MAX_ITEMS } from '../config.js';

// Fixed screen positions in logical canvas pixels (see CANVAS in config.js).
export const LAYOUT = {
    table: { x: 30, y: 150, w: 900, h: 360 },
    dealerFace: { x: 480, y: 78, r: 52 },
    dealerHud: { x: 40, y: 30 },
    playerHud: { x: 40, y: 530 },
    roundInfo: { x: 920, y: 30 },
    shotgun: { x: 480, y: 335 },
    shellRow: { x: 90, y: 345, size: 18, gap: 8 },
    items: { size: 60, gap: 10, dealerY: 168, playerY: 432 },
    shootDealer: { x: 40, y: 640, w: 200, h: 52 },
    shootSelf: { x: 256, y: 640, w: 200, h: 52 },
    log: { x: 480, y: 528, w: 450, h: 172 },
};

export function itemSlotRect(ownerId, index) {
    const { size, gap, dealerY, playerY } = LAYOUT.items;
    const rowWidth = MAX_ITEMS * size + (MAX_ITEMS - 1) * gap;
    const startX = LAYOUT.table.x + (LAYOUT.table.w - rowWidth) / 2;
    return {
        x: startX + index * (size + gap),
        y: ownerId === 'dealer' ? dealerY : playerY,
        w: size,
        h: size,
    };
}

export const contains = (rect, pt) =>
    pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h;
