import { decideAction } from './ai/dealer.js';
import { ROUNDS, TIMING } from './config.js';
import { ITEMS } from './model/items.js';
import { sleep } from './utils.js';
import { LAYOUT } from './view/layout.js';
import { COLORS } from './view/theme.js';

// Async game loop: sequences the rules (Game), the dealer AI, player input,
// pacing and effects. Mutates `view` so the renderer knows what to show.
//
// view.phase: 'title' | 'banner' | 'loading' | 'playerTurn' | 'dealerTurn' | 'busy'
export class Controller {
    constructor({ game, view, log, fx, input }) {
        Object.assign(this, { game, view, log, fx, input });
    }

    async run() {
        for (;;) {
            await this.banner('BUCKSHOT ROULETTE', [
                'You and the dealer take turns with a shotgun.',
                'Live shells hurt. Shooting yourself with a blank keeps your turn.',
                `Survive ${ROUNDS.length} rounds to win.`,
            ], { title: true });
            await this.playMatch();
        }
    }

    async banner(title, subtitle, { waitForInput = true, title: isTitle = false } = {}) {
        this.view.phase = isTitle ? 'title' : 'banner';
        this.view.overlay = {
            title,
            subtitle,
            prompt: waitForInput ? 'Click or press Enter to continue' : null,
        };
        if (waitForInput) await this.input.waitForContinue();
        else await sleep(TIMING.banner);
        this.view.overlay = null;
    }

    async playMatch() {
        const { game } = this;
        this.log.clear();
        for (let r = 0; r < ROUNDS.length; r++) {
            game.startRound(r);
            this.fx.aim(null);
            const { hp, itemsPerLoad } = game.roundConfig;
            await this.banner(`ROUND ${r + 1}`, [
                `${hp} charges each.`,
                itemsPerLoad ? `${itemsPerLoad} items dealt every reload.` : 'No items this round.',
            ], { waitForInput: false });
            this.log.push(`--- Round ${r + 1} ---`, 'accent');

            const winner = await this.playRound();
            if (winner === game.dealer) {
                await this.banner('YOU DIED', `The dealer takes round ${r + 1}.`);
                return;
            }
            if (game.isFinalRound) {
                await this.banner('YOU WIN', 'You ride off with the cash. For now.');
                return;
            }
            await this.banner('ROUND WON', 'The dealer resets the table...');
        }
    }

    async playRound() {
        const { game } = this;
        while (!game.roundWinner) {
            if (game.shotgun.isEmpty) {
                await this.reload();
                continue;
            }
            if (game.current.isPlayer) await this.playerStep();
            else await this.dealerStep();
        }
        return game.roundWinner;
    }

    async reload() {
        this.view.phase = 'loading';
        const { live, blank, dealt } = this.game.reload();
        this.view.loadPreview = { live, blank };
        this.log.push(`The dealer loads ${live} live and ${blank} blank shells.`, 'accent');
        if (dealt.player.length) {
            this.log.push(`You receive: ${dealt.player.map((id) => ITEMS[id].name).join(', ')}.`);
        }
        await sleep(TIMING.loadPreview);
        this.view.loadPreview = null;
    }

    async playerStep() {
        this.view.phase = 'playerTurn';
        const action = await this.input.waitForAction();
        this.view.phase = 'busy';
        await this.perform(this.game.player, action);
    }

    async dealerStep() {
        this.view.phase = 'dealerTurn';
        await sleep(TIMING.dealerThink);
        const action = decideAction(this.game, this.game.dealer);
        this.view.phase = 'busy';
        await this.perform(this.game.dealer, action);
    }

    async perform(actor, action) {
        if (action.type === 'item') {
            await this.useItem(actor, action.index);
        } else {
            const target = action.target === 'self' ? actor : this.game.opponentOf(actor);
            await this.shoot(actor, target);
        }
    }

    async useItem(actor, index) {
        const result = this.game.useItem(actor, index);
        if (!result) return;
        this.log.push(result.text);
        if (result.ejected) {
            const { live } = result.ejected;
            this.fx.floatText(live ? 'LIVE' : 'BLANK', LAYOUT.shellRow.x + 60, LAYOUT.shellRow.y - 30, live ? COLORS.live : COLORS.blank);
        }
        await sleep(TIMING.afterItem);
    }

    async shoot(shooter, target) {
        const self = shooter === target;
        this.fx.aim(target.id);
        if (shooter.isPlayer) this.log.push(self ? 'You turn the barrel on yourself...' : 'You aim at the dealer...');
        else this.log.push(self ? 'The dealer turns the barrel on itself...' : 'The dealer aims at you...');
        await sleep(TIMING.aim);

        const res = this.game.shoot(shooter, target);
        const hitPos = target.isPlayer
            ? { x: LAYOUT.playerHud.x + 60, y: LAYOUT.playerHud.y }
            : { x: LAYOUT.dealerFace.x, y: LAYOUT.dealerFace.y + 40 };

        if (res.shell.live) {
            this.fx.flash(COLORS.muzzle, 260);
            this.fx.shake(18, 380);
            this.fx.floatText(`-${res.damage}`, hitPos.x, hitPos.y, COLORS.danger);
            if (!target.isPlayer) this.fx.hurtDealer();
            const charges = res.damage > 1 ? `${res.damage} charges` : 'a charge';
            this.log.push(target.isPlayer ? `BANG! You lose ${charges}.` : `BANG! The dealer loses ${charges}.`, 'live');
        } else {
            this.fx.floatText('click', hitPos.x, hitPos.y, COLORS.blank);
            this.log.push('*click* ... blank.', 'blank');
            if (res.keepsTurn) this.log.push(shooter.isPlayer ? 'You keep your turn.' : 'The dealer goes again.');
        }
        await sleep(TIMING.afterShot);
        this.fx.aim(null);

        if (res.skipped && !this.game.roundWinner) {
            this.log.push(res.skipped.isPlayer
                ? 'You are roped up and lose your turn. You wriggle free.'
                : 'The dealer is roped up and loses the turn.', 'dim');
            await sleep(TIMING.skipTurn);
        }
    }
}
