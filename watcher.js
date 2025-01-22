

export class Watcher {

    COLOR_WHITE = new cv.Scalar(255);
    COLOR_BLACK = new cv.Scalar(0);
    THICKNESS = -1;

    constructor(video, updateRate, rois, cois) {
        this.video = video;
        this.rois = rois;
        this.cois = cois;
        this.frameData = null;
        this.updateRate = updateRate
    }

    watch() {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.createFrame();
        this._watch();
    }

    createFrame() {
        const videoHeight = this.video.videoHeight;
        const videoWidth = this.video.videoWidth;
        this.frameData = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4);
    }

    getFrame() {
        this.video.read(this.frameData);
    }

    createMasks() {
        let masks = []
        const videoHeight = this.video.videoHeight;
        const videoWidth = this.video.videoWidth;
        for (let i = 0; i < this.rois.length; i++) {
            const roi = this.rois[i];
            const newMask = cv.Mat(videoHeight, videoWidth, cv.CV_8UC1, new cv.Scalar(0))
            roi.mask.include.forEach(element => { this._draw(frame, element, COLOR_WHITE, thickness); });
            roi.mask.exclude.forEach(element => { this._draw(frame, element, COLOR_BLACK, thickness); });
            masks.push(newMask);
        }
    }

    applyMaskCheckColors(masks) {
        const matches = []
        for (let i = 0; i < masks.length; i++) {
            const mask = masks[i];
            maskedFrame = new cv.Mat();
            this.frameData.copyTo(maskedFrame, mask)

            for (let j = 0; j < this.cois.length; j++) {
                const min_color = this.cois[j].min;
                const max_color = this.cois[j].max;
                match = new cv.Mat()
                cv.inRange(maskedFrame, min_color, max_color, match);
                const matchCount = cv.countNonZero(match);
                if (matchCount > 0) {
                    matches.push(j);
                }
                match.delete();
            }
            maskedFrame.delete();
        }
        return matches;
    }

    _draw(frame, shape, color, thickness) {
        if (shape.type == "circle") {
            cv.circle(frame, properties.center, properties.radius, color, thickness);
        }
    }

    _watch() {
        this.getFrame();
        const masks = this.createMasks()
        console.log(this.applyMaskCheckColors(masks));
        setTimeout(this._watchFrame, 1000 / this.updateRate);
    }
}
