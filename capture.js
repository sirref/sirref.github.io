import { ScreenCapture } from './screencapture.js'

const SIZE = [1920, 1080]

const videoElement = document.getElementById("video")
const canvasElement = document.getElementById("canvas")
const processedCanvasElement = document.getElementById("processedCanvas");
const recordButton = document.getElementById("record");
let capturer = null


const recog = await (await fetch('./recog.json')).json()


async function OnRecordClicked() {
    if (capturer) {
        capturer.stop();
        capturer = null;
    } else {
        capturer = new ScreenCapture(videoElement, canvasElement);
        capturer.start();
    }
}

function SetUpEventListeners() {
    recordButton.addEventListener('click', OnRecordClicked)
}

function processFrame() {
    if (!capturer) { return; }
    let frame = capturer.getFrame();
    if (!frame) { return; }

    // Resize frame to 1080p
    const newSize = new cv.Size(SIZE[0], SIZE[1]);
    cv.resize(frame, frame, newSize, 0, 0, cv.INTER_AREA);

    // Create mask
    const maskMat = new cv.Mat.zeros(1080, 1920, cv.CV_8UC1);
    for (let i = 0; i < recog.roi.length; i++) {
        const mask = recog.roi[i].mask
        // Include
        for (let k = 0; k < mask.include.length; k++) {
            const include = mask.include[k];
            if (include.type == "circle") {
                const center = new cv.Point(include.center.x, include.center.y);
                const radius = include.radius;
                cv.circle(maskMat, center, radius, new cv.Scalar(255), -1);
            }
        }

        // excelude
        for (let k = 0; k < mask.exclude.length; k++) {
            const exclude = mask.exclude[k];
            if (exclude.type == "circle") {
                const center = new cv.Point(exclude.center.x, exclude.center.y);
                const radius = exclude.radius;
                cv.circle(maskMat, center, radius, new cv.Scalar(0), -1);
            }
        }
    }

    // Apply mask
    let result = new cv.Mat();
    cv.bitwise_and(frame, frame, result, maskMat)

    // Color
    const frameHsv = new cv.Mat();
    cv.cvtColor(result, frameHsv, cv.COLOR_RGB2HSV)
    const friendlyColorMask = new cv.Mat.zeros(1080, 1920, cv.CV_8UC1);
    const enemyColorMask = new cv.Mat.zeros(1080, 1920, cv.CV_8UC1);
    const friendlyColorMin = new cv.Mat(frameHsv.rows, frameHsv.cols, frameHsv.type(), recog.coi.friendly.min);
    const friendlyColorMax = new cv.Mat(frameHsv.rows, frameHsv.cols, frameHsv.type(), recog.coi.friendly.max);
    const enemyColorMin = new cv.Mat(frameHsv.rows, frameHsv.cols, frameHsv.type(), recog.coi.enemy.min);
    const enemyColorMax = new cv.Mat(frameHsv.rows, frameHsv.cols, frameHsv.type(), recog.coi.enemy.max);

    // const friendlyColorMin = new cv.Mat(frameHsv.rows, frameHsv.cols, frameHsv.type(), [100, 150, 50, 0]);
    // const friendlyColorMax = new cv.Mat(frameHsv.rows, frameHsv.cols, frameHsv.type(), [140, 255, 255, 0]);
    // const enemyColorMin = new cv.Mat(frameHsv.rows, frameHsv.cols, frameHsv.type(), [0, 100, 100, 0]);
    // const enemyColorMax = new cv.Mat(frameHsv.rows, frameHsv.cols, frameHsv.type(), [10, 255, 255, 255]);

    cv.inRange(frameHsv, friendlyColorMin, friendlyColorMax, friendlyColorMask);
    cv.inRange(frameHsv, enemyColorMin, enemyColorMax, enemyColorMask);
    const colorMask = new cv.Mat();
    cv.bitwise_or(enemyColorMask, friendlyColorMask, colorMask);

    // apply color mask
    let result2 = new cv.Mat();
    cv.bitwise_and(frame, frame, result2, colorMask);
    // Show processed frame
    cv.imshow(processedCanvasElement, result2);

    maskMat.delete();
    result.delete();
    friendlyColorMask.delete();
    enemyColorMask.delete();
    frameHsv.delete();
    frame.delete();
    enemyColorMax.delete();
    enemyColorMin.delete();
    friendlyColorMax.delete();
    friendlyColorMin.delete();
    colorMask.delete();
    result2.delete();
}

SetUpEventListeners();
setInterval(processFrame, 500);
