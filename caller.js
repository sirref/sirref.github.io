export class Caller {
    constructor(respawnTimer, gameTimer) {
        this.gameTimer = gameTimer;
        this.respawnTimer = respawnTimer;
        this.jumped = false;

        this.phase = this.gameTimer.getPhase();
    }

    setJumped(new_value) {
        this.jumped = new_value
    }

    isJumped() {
        if (this.phase != this.gameTimer.getPhase()) {
            this.setJumped(false);
        }
        this.phase = this.gameTimer.getPhase();
        return this.jumped;
    }

    toggleJumped() {
        this.setJumped(!this.jumped);
    }
}
