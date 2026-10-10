const MAX_ENTRIES = 30;

export class MessageLog {
    constructor() {
        this.entries = [];
    }

    push(textStr, color = null) {
        this.entries.push({ text: textStr, color, time: performance.now() });
        if (this.entries.length > MAX_ENTRIES) this.entries.shift();
    }

    clear() {
        this.entries = [];
    }
}
