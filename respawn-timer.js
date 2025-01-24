import { PHASES } from "./game-clock.js";

export class RespawnTimer {
    constructor(gameTimer, respawnTimes, intervals, jumpAdjustment) {
        this.gameTimer = gameTimer;
        this.respawnTimes = respawnTimes;
        this.intervals = intervals
        this.jumpTime = jumpAdjustment;
        this.jumped = false;
    }

    getRespawnAtTime(timeRemaining) {
        for (let i = 0; i < this.respawnTimes.length; i++) {
            if (this.respawnTimes[i] <= timeRemaining) {
                return this.respawnTimes[i];
            }
        }
    }

    getNextNormalRespawn() {
        const timeRemaining = this.gameTimer.getTimeRemainingInStage();
        return this.getRespawnAtTime(timeRemaining);
    }

    getTimeToRespawn() {
        if (this.jumped) {
            return this.getTimeToJumpedRespawn();
        } else {
            return this.getTimeToNormalRespawn();
        }
    }

    getNextJumpedRespawn() {
        const timeRemaining = this.gameTimer.getTimeRemainingInStage();
        const phase = this.gameTimer.getPhase();
        const normalRespawnTime = this.getNextNormalRespawn();
        if (phase == PHASES.PHASE1) {
            return normalRespawnTime;
        }

        if (this.isLastRespawnInPhase()) {
            return normalRespawnTime;
        }

        if (timeRemaining - normalRespawnTime >= this.jumpTime) {
            return normalRespawnTime + this.jumpTime;
        }

        const nextRespawnTime = this.getRespawnAtTime(normalRespawnTime - 1);
        return nextRespawnTime + this.jumpTime;
    }

    getTimeToNormalRespawn() {
        return this.gameTimer.getTimeRemainingInStage() - this.getNextNormalRespawn();
    }

    getTimeToJumpedRespawn() {
        return this.gameTimer.getTimeRemainingInStage() - this.getNextJumpedRespawn();
    }

    isLastRespawnInPhase() {
        const timeRemPhase = this.gameTimer.getTimeRemainingInPhase();
        return timeRemPhase <= this.jumpTime;
    }

    getRespawnsLeftInPhase() {
        const phaseEnd = this.gameTimer.getPhaseTime();
        const timeRem = this.gameTimer.getTimeRemainingInStage();

        // Find the current phase based on the time remaining
        let currentPhaseIndex = phase - 1;

        // If no phase matches, return 0 (no respawns left)
        if (currentPhaseIndex === -1) return 0;

        // Count respawns within the current phase and still valid for timeRemaining
        return this.respawnTimes.filter(
            (time) => time < timeRem && time >= phaseEnd
        ).length;
    }

    getRespawnInterval() {
        const phase = this.gameTimer.getPhase()
        return this.intervals[phase - 1];
    }

    isJumped() {
        return this.jumped;
    }

    toggleJumped() {
        this.setJumped(!this.jumped);
    }

    setJumped(value) {
        this.jumped = value;
    }
}
