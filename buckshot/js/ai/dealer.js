// Dealer decision-making. Uses only information the dealer could legitimately
// have: public shell tally, shells it has seen, and the inverter state.

// Probability that the chambered shell is live, from `me`'s point of view.
export function liveProbability(game, me) {
    const { shells } = game.shotgun;
    const current = shells[0];
    if (current.knownBy.has(me.id)) return current.live ? 1 : 0;

    let live = 0;
    let unknown = 0;
    shells.forEach((shell, i) => {
        if (i > 0 && shell.knownBy.has(me.id)) return;
        unknown++;
        if (shell.original) live++;
    });
    const p = live / unknown;
    return current.inverted ? 1 - p : p;
}

function usableItem(game, me, id) {
    const index = me.items.findIndex((item, i) => item === id && game.canUseItem(me, i));
    return index >= 0 ? { type: 'item', index } : null;
}

// Returns { type: 'item', index } or { type: 'shoot', target: 'self' | 'opponent' }.
export function decideAction(game, me) {
    const p = liveProbability(game, me);
    const known = p === 0 || p === 1;
    const item = (id) => usableItem(game, me, id);

    const action =
        (me.hp < me.maxHp && item('cigarettes')) ||
        (!known && item('magnifier')) ||
        (p <= 0.3 && item('inverter')) ||
        (p >= 0.7 && item('handsaw')) ||
        (p >= 0.5 && item('handcuffs')) ||
        (!known && game.shotgun.count > 2 && item('phone')) ||
        (p > 0.3 && p < 0.7 && game.shotgun.count > 1 && item('beer'));
    if (action) return action;

    const shootOpponent = p > 0.5 || (p === 0.5 && Math.random() < 0.5);
    return { type: 'shoot', target: shootOpponent ? 'opponent' : 'self' };
}
