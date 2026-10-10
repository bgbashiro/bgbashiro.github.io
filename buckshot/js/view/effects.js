// Short-lived visual effects. The controller triggers them; the renderer reads them.
export class Effects {
    constructor() {
        this.flashes = [];
        this.floaters = [];
        this.shakeUntil = 0;
        this.shakeStrength = 0;
        this.dealerHurtUntil = 0;
        // Target angle for the shotgun (radians); renderer eases toward it.
        this.aimAngle = 0;
    }

    now() {
        return performance.now();
    }

    flash(color, duration = 350) {
        this.flashes.push({ color, start: this.now(), duration });
    }

    shake(strength = 10, duration = 300) {
        this.shakeStrength = strength;
        this.shakeUntil = this.now() + duration;
    }

    floatText(str, x, y, color, duration = 1200) {
        this.floaters.push({ str, x, y, color, start: this.now(), duration });
    }

    hurtDealer(duration = 600) {
        this.dealerHurtUntil = this.now() + duration;
    }

    // 'dealer' points up the table, 'player' points at the camera, null rests sideways.
    aim(target) {
        this.aimAngle = target === 'dealer' ? -Math.PI / 2 : target === 'player' ? Math.PI / 2 : 0;
    }

    shakeOffset(t) {
        if (t > this.shakeUntil) return { x: 0, y: 0 };
        const s = this.shakeStrength;
        return { x: (Math.random() - 0.5) * s, y: (Math.random() - 0.5) * s };
    }

    update(t) {
        this.flashes = this.flashes.filter((f) => t - f.start < f.duration);
        this.floaters = this.floaters.filter((f) => t - f.start < f.duration);
    }
}
