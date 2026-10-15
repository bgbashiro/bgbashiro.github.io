// Tunable game constants (balance and pacing). Visuals live in view/theme.js,
// screen positions in view/layout.js.

// Each round raises the stakes: more charges (HP) and more items per reload.
export const ROUNDS = [
    { hp: 2, itemsPerLoad: 0 },
    { hp: 4, itemsPerLoad: 2 },
    { hp: 5, itemsPerLoad: 4 },
];

export const MAX_ITEMS = 8;
export const SHELL_COUNT = { min: 2, max: 8 };

// Milliseconds for the paced parts of the game loop.
export const TIMING = {
    banner: 1600,
    loadPreview: 2400,
    dealerThink: 900,
    aim: 500,
    afterShot: 1000,
    afterItem: 900,
    skipTurn: 900,
};
