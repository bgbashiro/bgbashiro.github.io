// Visual theme: a frontier saloon. Palette and fonts only; swap this file
// (and icons.js) to reskin the game without touching rules or layout.

export const FONTS = {
    display: '"Rye", Georgia, serif',
    body: '"Special Elite", "Courier New", monospace',
};

export const COLORS = {
    // Saloon wall and lamplight
    bg: '#1a0f08',
    wallPlank: '#3a2314',
    wallPlankAlt: '#331f11',
    wallSeam: '#1f1209',
    lampGlow: 'rgba(255, 176, 72, 0.22)',

    // Card table: wooden rim around green felt
    rim: '#6b3f1d',
    rimLight: '#8c5a2c',
    rimDark: '#3d220e',
    felt: '#2e4a2b',
    feltDark: '#223822',

    // Signboards (buttons)
    wood: '#7a4a22',
    woodHover: '#9a6431',
    woodDisabled: '#3a2617',
    woodEdge: '#2a170a',
    nail: '#cdb17a',

    // Parchment (log, posters, cards, tooltips)
    paper: '#ead9b0',
    paperHover: '#f6e9c8',
    paperEdge: '#a5845a',
    ink: '#3a2614',
    inkDim: '#7a6248',

    // Text on dark wood
    text: '#f3e4c0',
    dim: '#b89b72',
    accent: '#f0b44c',
    danger: '#e2552f',

    // Shells and charges
    live: '#b8322a',
    blank: '#5b7083',
    unknown: '#4a3322',
    brass: '#c9a24a',
    charge: '#e8c25a',
    chargeEmpty: '#4a3420',

    // The dealer
    skin: '#d6a57a',
    hat: '#4a2c16',
    hatBand: '#22140a',
    mustache: '#2e1c0e',

    muzzle: '#ffd28a',
};

// Ink colours for message-log tags, chosen to read on parchment.
export const LOG_INK = {
    default: COLORS.ink,
    accent: '#8a4a12',
    live: '#9c1f17',
    blank: '#35506a',
    dim: COLORS.inkDim,
};
