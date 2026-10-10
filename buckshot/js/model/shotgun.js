import { shuffle } from '../utils.js';

// A shell remembers its type at load time (`original`) separately from its
// current type (`live`) so the inverter can flip it without leaking the
// public live/blank tally. `knownBy` holds ids of participants who have seen it.
function makeShell(live) {
    return { live, original: live, inverted: false, knownBy: new Set() };
}

export class Shotgun {
    constructor() {
        this.clear();
    }

    clear() {
        this.shells = [];
        this.sawed = false;
    }

    load(live, blank) {
        const shells = [];
        for (let i = 0; i < live; i++) shells.push(makeShell(true));
        for (let i = 0; i < blank; i++) shells.push(makeShell(false));
        this.shells = shuffle(shells);
        this.sawed = false;
    }

    get count() {
        return this.shells.length;
    }

    get isEmpty() {
        return this.shells.length === 0;
    }

    get current() {
        return this.shells[0] ?? null;
    }

    // Live/blank tally as an observer who tracked every revealed shell would know it.
    publicCounts() {
        const live = this.shells.filter((s) => s.original).length;
        return { live, blank: this.shells.length - live };
    }

    reveal(index, who) {
        this.shells[index]?.knownBy.add(who);
    }

    // Rack the current shell out without firing it.
    eject() {
        return this.shells.shift() ?? null;
    }

    fire() {
        const shell = this.shells.shift();
        const damage = shell.live ? (this.sawed ? 2 : 1) : 0;
        this.sawed = false;
        return { shell, damage };
    }

    invertCurrent() {
        const shell = this.current;
        if (!shell) return;
        shell.live = !shell.live;
        shell.inverted = !shell.inverted;
    }
}
