export class RealClock {
    constructor(adjustment) {
        this.adjustment = adjustment;
    }

    nudge(diff) {
        this.adjustment += diff
    }

    resetNudge() {
        this.adjustment = 0;
    }

    getSecondsPastHour() {
        const now = new Date();
        return now.getMinutes() * 60 + now.getSeconds() + this.adjustment;
    }

    getAdjustment() {
        return this.adjustment;
    }
}
