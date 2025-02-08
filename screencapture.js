const DISPLAY_MEDIA_OPTIONS = { video: true }

export class ScreenCapture {
    constructor(video, canvas) {
        this.video = video
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
    }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getDisplayMedia(DISPLAY_MEDIA_OPTIONS);
            this.video.srcObject = this.stream;
        } catch (err) {
            console.error('Error starting screen capture:', err);
        }
    }

    getFrame() {
        if (!this.video.videoWidth || !this.video.videoHeight) {
            console.error('Video not ready');
            return null;
        }

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        let imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        let mat = cv.matFromImageData(imgData);
        return mat;
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}
