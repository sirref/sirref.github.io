import { PHASES } from './game-clock.js'

class CapturePoint {
    constructor(label) {
        this.label = label
        this.captureTime = 0
        this.capturePhase = PHASES.NONE
    }

    isCaptured() {
        return this.captureTime > 0;
    }
}

export class Caller {
    constructor(respawnTimer, gameTimer) {
        this.gameTimer = gameTimer;
        this.respawnTimer = respawnTimer;
        this.manual = true;
        this.phase = this.gameTimer.getPhase();
        this.points = { "A": new CapturePoint("A"), "B": new CapturePoint("B"), "C": new CapturePoint("C") }
    }

    update() {
        if (this.checkResetJump()) {
            this.resetJump();
        }
    }

    capture(label) {
        this.manual = false;
        this.points[label].captureTime = this.gameTimer.getTimeRemainingInStage();
        this.points[label].capturePhase = this.gameTimer.getPhase();
        this.respawnTimer.setJumped(true);
    }

    upcature(label) {
        this.manual = false;
        this.points[label].captureTime = 0;
        this.points[label].capturePhase = PHASES.NONE;
    }

    isJumpedAutomatic() {
        const phase = this.gameTimer.getPhase();

        let anyCaptures = false;
        Object.values(this.points).forEach(element => {
            if (element.capturePhase == phase) {
                anyCaptures = true;
            }
        });
    }

    checkResetJump() {
        if (this.manual) {
            return this.phase != this.gameTimer.getPhase();
        } else {
            const phase = this.gameTimer.getPhase();
            let anyCaptures = false;
            Object.values(this.points).forEach(element => {
                if (element.capturePhase == phase) {
                    anyCaptures = true;
                }
            });
            return !anyCaptures;
        }
    }

    resetJump() {
        this.respawnTimer.setJumped(false);
    }

    toggleJump() {
        this.manual = true;
        this.phase = this.gameTimer.getPhase();
        this.setJumped(!this.respawnTimer.isJumped());
    }

    setJumped(value) {
        this.respawnTimer.setJumped(value)
    }
}

export class ManualCaller {

}
export class AutomaticCaller {

}
