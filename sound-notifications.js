export class SoundNotifications {
    constructor(respawnTimer, when, sound) {
        this.respawnTimer = respawnTimer;
        this.when = when
        this.sound = sound
        this.hasPlayed = false
        this.disabled = false
    }

    update() {
        if (this.isTimeToPlay()) {
            this.play();
        }
        this.reset();
    }

    isTimeToPlay() {
        const timeToRespawn = this.respawnTimer.getTimeToRespawn();
        return !this.hasPlayed && timeToRespawn == this.when && !this.disabled;
    }

    reset() {
        const timeToRespawn = this.respawnTimer.getTimeToRespawn();
        if (this.hasPlayed) {
            if (timeToRespawn != this.when) {
                this.hasPlayed = false;
            }
        }
    }

    play() {
        this.sound.play();
        this.hasPlayed = true
    }
}
