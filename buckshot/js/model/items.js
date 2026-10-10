import { randInt } from '../utils.js';

// Item registry. Each item exposes:
//   canUse(ctx) -> bool   (optional, defaults to true)
//   use(ctx)    -> { text, ...extra }
// where ctx = { game, user, opponent }.
// To add an item: add an entry here and an icon case in view/icons.js.

const shellWord = (shell) => (shell.live ? 'LIVE' : 'BLANK');

// Pick the player-facing or dealer-facing message.
const say = (user, youText, dealerText) => (user.isPlayer ? youText : dealerText);

export const ITEMS = {
    magnifier: {
        name: 'Magnifying Glass',
        description: 'Check the shell in the chamber.',
        use({ game, user }) {
            const shell = game.shotgun.current;
            shell.knownBy.add(user.id);
            return {
                text: say(user,
                    `You peek into the chamber... ${shellWord(shell)}.`,
                    'The dealer peers into the chamber.'),
            };
        },
    },

    cigarettes: {
        name: 'Cigarettes',
        description: 'Restore 1 charge.',
        canUse: ({ user }) => user.hp < user.maxHp,
        use({ user }) {
            user.heal(1);
            return { text: say(user, 'You smoke a cigarette. +1 charge.', 'The dealer smokes a cigarette. +1 charge.') };
        },
    },

    beer: {
        name: 'Beer',
        description: 'Rack the shotgun, ejecting the current shell.',
        use({ game, user }) {
            const shell = game.shotgun.eject();
            return {
                text: say(user,
                    `You crack a beer and rack the gun. A ${shellWord(shell)} shell flies out.`,
                    `The dealer racks the gun. A ${shellWord(shell)} shell flies out.`),
                ejected: shell,
            };
        },
    },

    handsaw: {
        name: 'Hand Saw',
        description: 'Saw off the barrel: the next shot deals 2 damage.',
        canUse: ({ game }) => !game.shotgun.sawed,
        use({ game, user }) {
            game.shotgun.sawed = true;
            return { text: say(user, 'You saw off the barrel. Next hit deals double.', 'The dealer saws off the barrel. Next hit deals double.') };
        },
    },

    handcuffs: {
        name: 'Handcuffs',
        description: 'Opponent skips their next turn.',
        canUse: ({ game, opponent }) => !opponent.cuffed && !game.cuffLock,
        use({ user, opponent }) {
            opponent.cuffed = true;
            return { text: say(user, 'You cuff the dealer. Their next turn is skipped.', 'The dealer cuffs you. Your next turn is skipped.') };
        },
    },

    inverter: {
        name: 'Inverter',
        description: 'Flip the current shell: live <-> blank.',
        use({ game, user }) {
            game.shotgun.invertCurrent();
            return { text: say(user, 'You flip the inverter. The chambered shell switches polarity.', 'The dealer uses an inverter on the chambered shell.') };
        },
    },

    phone: {
        name: 'Burner Phone',
        description: 'A voice reveals a random future shell.',
        use({ game, user }) {
            const { shotgun } = game;
            if (shotgun.count < 2) {
                return { text: say(user, 'The phone crackles: "How unfortunate..."', 'The dealer makes a short call.') };
            }
            const index = randInt(1, shotgun.count - 1);
            shotgun.reveal(index, user.id);
            return {
                text: say(user,
                    `A voice whispers: "Shell #${index + 1}... ${shellWord(shotgun.shells[index])}."`,
                    'The dealer makes a short call.'),
            };
        },
    },
};

export const ITEM_IDS = Object.keys(ITEMS);
