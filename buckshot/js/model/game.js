import { ROUNDS, SHELL_COUNT } from '../config.js';
import { clamp, pick, randInt } from '../utils.js';
import { ITEMS, ITEM_IDS } from './items.js';
import { Participant } from './participant.js';
import { Shotgun } from './shotgun.js';

// Pure game rules: no timing, rendering or input. The controller drives it.
export class Game {
    constructor() {
        this.player = new Participant('player', 'You');
        this.dealer = new Participant('dealer', 'Dealer');
        this.shotgun = new Shotgun();
        this.roundIndex = 0;
        this.turnId = 'player';
        // Set after a cuffed participant's turn is skipped so cuffs can't be chained.
        this.cuffLock = false;
        this.lastLoad = null;
    }

    get participants() {
        return [this.player, this.dealer];
    }

    get roundConfig() {
        return ROUNDS[this.roundIndex];
    }

    get isFinalRound() {
        return this.roundIndex === ROUNDS.length - 1;
    }

    get current() {
        return this.turnId === 'player' ? this.player : this.dealer;
    }

    get roundWinner() {
        if (this.player.isDead) return this.dealer;
        if (this.dealer.isDead) return this.player;
        return null;
    }

    opponentOf(participant) {
        return participant === this.player ? this.dealer : this.player;
    }

    startRound(index) {
        this.roundIndex = index;
        for (const p of this.participants) p.reset(this.roundConfig.hp);
        this.shotgun.clear();
        this.turnId = 'player';
        this.cuffLock = false;
        this.lastLoad = null;
    }

    reload() {
        const total = randInt(SHELL_COUNT.min, SHELL_COUNT.max);
        const live = clamp(Math.floor(total / 2) + randInt(-1, 1), 1, total - 1);
        const blank = total - live;
        this.shotgun.load(live, blank);

        const dealt = { player: [], dealer: [] };
        for (const p of this.participants) {
            for (let i = 0; i < this.roundConfig.itemsPerLoad && p.hasRoom; i++) {
                const id = pick(ITEM_IDS);
                p.addItem(id);
                dealt[p.id].push(id);
            }
            p.cuffed = false;
        }
        this.turnId = 'player';
        this.cuffLock = false;
        this.lastLoad = { live, blank };
        return { live, blank, dealt };
    }

    itemContext(user) {
        return { game: this, user, opponent: this.opponentOf(user) };
    }

    canUseItem(user, index) {
        const id = user.items[index];
        if (!id || this.shotgun.isEmpty) return false;
        const item = ITEMS[id];
        return item.canUse ? item.canUse(this.itemContext(user)) : true;
    }

    useItem(user, index) {
        if (!this.canUseItem(user, index)) return null;
        const id = user.takeItem(index);
        const result = ITEMS[id].use(this.itemContext(user));
        return { itemId: id, ...result };
    }

    shoot(shooter, target) {
        const { shell, damage } = this.shotgun.fire();
        target.takeDamage(damage);
        // Shooting yourself with a blank keeps the turn.
        const keepsTurn = target === shooter && !shell.live;
        const { skipped } = keepsTurn ? { skipped: null } : this.passTurn();
        return { shell, damage, keepsTurn, skipped };
    }

    passTurn() {
        const next = this.opponentOf(this.current);
        if (next.cuffed) {
            next.cuffed = false;
            this.cuffLock = true;
            return { skipped: next };
        }
        this.turnId = next.id;
        this.cuffLock = false;
        return { skipped: null };
    }
}
