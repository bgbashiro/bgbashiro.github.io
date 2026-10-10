import { ITEMS } from '../model/items.js';
import { LAYOUT, itemSlotRect } from './layout.js';

// Interactive regions, rebuilt from state each frame so the renderer and the
// input handler always agree on what is on screen.
//   { rect, label?, itemId?, owner?, hotkey?, enabled, action, tooltip }
export function buildButtons(game, view) {
    const active = view.phase === 'playerTurn';
    const buttons = [
        {
            rect: LAYOUT.shootDealer,
            label: 'SHOOT DEALER',
            hotkey: 'D',
            enabled: active,
            action: { type: 'shoot', target: 'opponent' },
            tooltip: 'Live: the dealer loses a charge. Either way, your turn ends.',
        },
        {
            rect: LAYOUT.shootSelf,
            label: 'SHOOT SELF',
            hotkey: 'S',
            enabled: active,
            action: { type: 'shoot', target: 'self' },
            tooltip: 'Blank: you keep your turn. Live: you take the hit.',
        },
    ];

    for (const owner of game.participants) {
        owner.items.forEach((itemId, index) => {
            const mine = owner.isPlayer;
            buttons.push({
                rect: itemSlotRect(owner.id, index),
                itemId,
                owner: owner.id,
                hotkey: mine ? String(index + 1) : null,
                enabled: mine && active && game.canUseItem(owner, index),
                action: mine ? { type: 'item', index } : null,
                tooltip: `${mine ? '' : "Dealer's "}${ITEMS[itemId].name}: ${ITEMS[itemId].description}`,
            });
        });
    }
    return buttons;
}
