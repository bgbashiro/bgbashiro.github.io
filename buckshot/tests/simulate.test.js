// Headless sanity check: pit the dealer AI against itself for many rounds and
// assert the rules never break. Run with `node tests/simulate.test.js`.
import assert from 'node:assert/strict';
import { decideAction } from '../js/ai/dealer.js';
import { MAX_ITEMS, ROUNDS } from '../js/config.js';
import { Game } from '../js/model/game.js';

const GAMES = 2000;
const MAX_STEPS = 2000;

function playRound(game, roundIndex) {
    game.startRound(roundIndex);
    for (let step = 0; step < MAX_STEPS; step++) {
        if (game.roundWinner) return game.roundWinner;
        if (game.shotgun.isEmpty) game.reload();

        const actor = game.current;
        const action = decideAction(game, actor);
        if (action.type === 'item') {
            const result = game.useItem(actor, action.index);
            assert.ok(result, `AI picked an unusable item: ${actor.items[action.index]}`);
        } else {
            const target = action.target === 'self' ? actor : game.opponentOf(actor);
            game.shoot(actor, target);
        }

        for (const p of game.participants) {
            assert.ok(p.hp >= 0 && p.hp <= p.maxHp, `hp out of range: ${p.hp}/${p.maxHp}`);
            assert.ok(p.items.length <= MAX_ITEMS, 'too many items');
        }
    }
    throw new Error('round did not finish');
}

const wins = { player: 0, dealer: 0 };
for (let g = 0; g < GAMES; g++) {
    const game = new Game();
    const winner = playRound(game, g % ROUNDS.length);
    wins[winner.id]++;
}

// Shotgun mechanics.
{
    const game = new Game();
    game.startRound(0);
    game.shotgun.load(1, 0);
    game.shotgun.sawed = true;
    const { damage } = game.shotgun.fire();
    assert.equal(damage, 2, 'sawed-off live shot should deal 2');
    assert.equal(game.shotgun.sawed, false, 'saw resets after firing');

    game.shotgun.load(0, 2);
    game.turnId = 'player';
    const res = game.shoot(game.player, game.player);
    assert.ok(res.keepsTurn && game.current === game.player, 'blank on self keeps the turn');

    game.dealer.cuffed = true;
    game.shoot(game.player, game.dealer);
    assert.equal(game.current, game.player, 'cuffed dealer is skipped');
    assert.equal(game.dealer.cuffed, false, 'cuffs come off after the skip');
}

console.log(`ok: ${GAMES} simulated rounds, first-mover wins ${wins.player}, second ${wins.dealer}`);
