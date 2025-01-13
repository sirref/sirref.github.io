export const PHASES = Object.freeze({
    UNKNOWN: -1,
    NONE: 0,
    PHASE1: 1,
    PHASE2: 2,
    PHASE3: 3,
    PHASE4: 4,
    PHASE5: 5,
    PHASE6: 6
});

export const STAGES = Object.freeze({
    PREP: "Prep",
    WAR: "War",
    BREAK: "Break"
});

export class GameTimer {
    constructor(clock, stageTimes, phaseTimes) {
        this.clock = clock;
        this.stageTimes = stageTimes;
        this.phaseTimes = phaseTimes;
    }

    getStage() {
        const now = this.clock.getSecondsPastHour();
        if (this.stageTimes.PREP_START <= now && now < this.stageTimes.PREP_END) {
            return STAGES.PREP;
        } else if (this.stageTimes.WAR_START <= now && now < this.stageTimes.WAR_END) {
            return STAGES.WAR;
        } else {
            return STAGES.BREAK;
        }
    }

    getTimeRemainingInStage() {
        const stage = this.getStage();
        const now = this.clock.getSecondsPastHour();
        if (stage == STAGES.PREP) {
            return this.stageTimes.PREP_END - now;
        } else if (stage == STAGES.WAR) {
            return this.stageTimes.WAR_END - now;
        } else {
            return this.stageTimes.BREAK_END - now;
        }
    }

    getPhase() {
        if (this.getStage() != STAGES.WAR) {
            return PHASES.NONE;
        }

        for (let i = 0; i < this.phaseTimes.length; i++) {
            if (this.phaseTimes[i] < this.getTimeRemainingInStage()) {
                return PHASES[`PHASE${i + 1}`];
            }
        }
        return PHASES.PHASE6;
    }

    getPhaseTime() {
        const phase = this.getPhase()
        if (phase != PHASES.NONE) {
            return this.phaseTimes[phase - 1];
        }
        return 0;
    }

    getTimeRemainingInPhase() {
        const now = this.getTimeRemainingInStage();
        const phaseEnd = this.getPhaseTime();
        return now - phaseEnd;
    }

    getNumberOfPhases() {
        return this.phaseTimes.length;
    }

    changeStageTimes(newTimes) {
        this.stageTimes = newTimes;
    }
}
