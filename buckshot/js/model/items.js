import { randInt } from '../utils.js';

// Item registry. Each item exposes:
//   canUse(ctx) -> bool   (optional, defaults to true)
//   use(ctx)    -> { text, ...extra }
// where ctx = { game, user, opponent }.
// To add an item: add an entry here and an icon case in view/icons.js.
// Keys are stable ids; `name`/`description` and messages carry the theme.

const shellWord = (shell) => (shell.live ? 'LIVE' : 'BLANK');

// Pick the player-facing or dealer-facing message.
const say = (user, youText, dealerText) => (user.isPlayer ? youText : dealerText);

export const ITEMS = {
    magnifier: {
        name: 'Spyglass',
        description: 'Check the shell in the chamber.',
        use({ game, user }) {
            const shell = game.shotgun.current;
            shell.knownBy.add(user.id);
            return {
                text: say(user,
                    `You squint down the spyglass... ${shellWord(shell)}.`,
                    'The dealer peers into the chamber.'),
            };
        },
    },

    cigarettes: {
        name: 'Cigar',
        description: 'Restore 1 charge.',
        canUse: ({ user }) => user.hp < user.maxHp,
        use({ user }) {
            user.heal(1);
            return { text: say(user, 'You light a cigar. +1 charge.', 'The dealer lights a cigar. +1 charge.') };
        },
    },

    beer: {
        name: 'Whiskey',
        description: 'Rack the shotgun, ejecting the current shell.',
        use({ game, user }) {
            const shell = game.shotgun.eject();
            return {
                text: say(user,
                    `You knock back a whiskey and rack the gun. A ${shellWord(shell)} shell flies out.`,
                    `The dealer racks the gun. A ${shellWord(shell)} shell flies out.`),
                ejected: shell,
            };
        },
    },

    handsaw: {
        name: 'Hacksaw',
        description: 'Saw off the barrel: the next shot deals 2 damage.',
        canUse: ({ game }) => !game.shotgun.sawed,
        use({ game, user }) {
            game.shotgun.sawed = true;
            return { text: say(user, 'You saw off the barrel. Next hit deals double.', 'The dealer saws off the barrel. Next hit deals double.') };
        },
    },

    handcuffs: {
        name: 'Lasso',
        description: 'Opponent skips their next turn.',
        canUse: ({ game, opponent }) => !opponent.cuffed && !game.cuffLock,
        use({ user, opponent }) {
            opponent.cuffed = true;
            return { text: say(user, 'You lasso the dealer. Their next turn is skipped.', 'The dealer ropes you in. Your next turn is skipped.') };
        },
    },

    inverter: {
        name: 'Two-Faced Coin',
        description: 'Flip the current shell: live <-> blank.',
        use({ game, user }) {
            game.shotgun.invertCurrent();
            return { text: say(user, 'You flip the two-faced coin. The chambered shell switches.', 'The dealer flips a coin over the chambered shell.') };
        },
    },

    phone: {
        name: 'Telegram',
        description: 'A wire reveals a random future shell.',
        use({ game, user }) {
            const { shotgun } = game;
            if (shotgun.count < 2) {
                return { text: say(user, 'The telegram reads: "HOW UNFORTUNATE STOP"', 'The dealer reads a telegram.') };
            }
            const index = randInt(1, shotgun.count - 1);
            shotgun.reveal(index, user.id);
            return {
                text: say(user,
                    `The telegram reads: "SHELL ${index + 1} ${shellWord(shotgun.shells[index])} STOP"`,
                    'The dealer reads a telegram.'),
            };
        },
    },
};

export const ITEM_IDS = Object.keys(ITEMS);
