// Tunable game constants. Everything balance- or layout-related lives here.

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

export const CANVAS = { width: 960, height: 720 };

export const COLORS = {
    bg: '#0d0d0f',
    table: '#1f3a2b',
    tableEdge: '#0f1f16',
    slot: '#163024',
    live: '#d83a3a',
    blank: '#5f7a96',
    unknown: '#3a3a3a',
    text: '#e8e2d0',
    dim: '#8a8474',
    accent: '#e8ac65',
    charge: '#ffcb69',
    chargeEmpty: '#3b362b',
    danger: '#ff4d4d',
    button: '#2c2a26',
    buttonHover: '#45413a',
    buttonDisabled: '#1a1917',
    face: '#d9d2bf',
};
