export class SimulatedClock {
    constructor(start, frequency) {
        this.start = start;
        this.frequency = frequency;
        this.adjustment = 0;
    }

    nudge(diff) {
        this.adjustment += diff
    }

    resetNudge() {
        this.adjustment = 0;
    }

    getSecondsPastHour() {
        return this.start + this.adjustment;
    }

    getAdjustment() {
        return this.adjustment;
    }

}
