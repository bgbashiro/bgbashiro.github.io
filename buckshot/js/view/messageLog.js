const MAX_ENTRIES = 30;

export class MessageLog {
    constructor() {
        this.entries = [];
    }

    // tag: 'default' | 'accent' | 'live' | 'blank' | 'dim'; the theme picks the ink.
    push(textStr, tag = 'default') {
        this.entries.push({ text: textStr, tag, time: performance.now() });
        if (this.entries.length > MAX_ENTRIES) this.entries.shift();
    }

    clear() {
        this.entries = [];
    }
}
