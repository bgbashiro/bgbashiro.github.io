import { MAX_ITEMS } from '../config.js';

export class Participant {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.reset(0);
    }

    get isPlayer() {
        return this.id === 'player';
    }

    get isDead() {
        return this.hp <= 0;
    }

    get hasRoom() {
        return this.items.length < MAX_ITEMS;
    }

    reset(maxHp) {
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.items = [];
        this.cuffed = false;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
    }

    heal(amount) {
        const before = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - before;
    }

    addItem(id) {
        if (!this.hasRoom) return false;
        this.items.push(id);
        return true;
    }

    takeItem(index) {
        return this.items.splice(index, 1)[0];
    }
}
