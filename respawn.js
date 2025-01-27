import { RealClock } from './real-clock.js'
import { GameTimer, STAGES, PHASES } from './game-clock.js'
import { RespawnTimer } from './respawn-timer.js'
import { Caller } from './caller.js';
import { Watcher } from './watcher.js';
import { SimulatedClock } from './simulated-clock.js';
import { SoundNotifications } from './sound-notifications.js';
// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

// const RESPAWN_TIMES0 = [
//     1780, 1760, 1740, 1720, 1700, 1680, 1660, 1640, 1620, 1600,
//     1580, 1560, 1540, 1520, 1500, 1492, 1464, 1436, 1408, 1380,
//     1352, 1324, 1296, 1268, 1240, 1212, 1184, 1148, 1112, 1076,
//     1040, 1004, 968, 932, 896, 860, 816, 772, 728, 684,
//     640, 596, 550, 498, 446, 394, 342, 290, 230, 170,
//     110, 50
// ];

const RESPAWN_TIMES = [
    1780, 1760, 1740, 1720, 1700, 1680, 1660, 1640, 1620, 1600, 1580, 1560,
    1540, 1520, 1500, 1490, 1462, 1434, 1406, 1378, 1350, 1322, 1294, 1266, 1238,
    1210, 1182, 1146, 1110, 1074, 1038, 1002, 966, 930, 894, 858, 814, 770, 726,
    682, 638, 594, 550, 498, 446, 394, 342, 290, 230, 170, 110, 50
];

const RESPAWN_INTERVALS = [20, 28, 36, 44, 52, 60];

const PHASE_TIMES = [1500, 1184, 860, 550, 290, 50];

const MODE1_STAGES = {
    PREP_START: 2700,
    PREP_END: 3600,
    WAR_START: 0,
    WAR_END: 1800,
    BREAK_START: 1800,
    BREAK_END: 2700
};

const MODE2_STAGES = {
    PREP_START: 900,
    PREP_END: 1800,
    WAR_START: 1800,
    WAR_END: 3600,
    BREAK_START: 0,
    BREAK_END: 900
};

const JUMP_ADJUSTMENT = 8;

const NO_RESPAWNS_REMAINING = "No respawns remaining"

const COIS = {
    "enemy": {
        min: (340, 65, 50),
        max: (360, 100, 100)
    },
    "friendly": {
        min: (180, 50, 40),
        max: (240, 100, 100)
    }
};
const ROIS = [
    {
        name: "A",
        crop: { x: 879, y: 63, w: 40, h: 40 },
        mask: {
            include: [
                {
                    type: "circle",
                    center: { x: 899, y: 83 },
                    radius: 20
                }
            ],
            exclude: [
                {
                    type: "circle",
                    center: { x: 899, y: 83 },
                    radius: 15
                }
            ]
        },
        range: {
            "enemy": {
                min: (340, 65, 50),
                max: (360, 100, 100)
            },
            "friendly": {
                min: (180, 50, 40),
                max: (240, 100, 100)
            }
        }
    },
    {
        name: "B",
        crop: { x: 939, y: 63, w: 40, h: 40 },
        mask: {
            include: [
                {
                    type: "circle",
                    center: { x: 959, y: 83 },
                    radius: 20
                }
            ],
            exclude: [
                {
                    type: "circle",
                    center: { x: 959, y: 83 },
                    radius: 15
                }
            ]
        }
    },
    {
        name: "C",
        crop: { x: 999, y: 63, w: 40, h: 40 },
        mask: {
            include: [
                {
                    type: "circle",
                    center: { x: 1019, y: 83 },
                    radius: 20
                }
            ],
            exclude: [
                {
                    type: "circle",
                    center: { x: 1019, y: 83 },
                    radius: 20
                }
            ]
        }
    }
];


// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------
// let mode = MODE1_STAGES
// let stage = STAGES.BREAK;
// let phase = 0;
// let captureTimes = [];
// let timeRem = 0;
// let respawnTime = 0;
// let timeToRespawn = 0;
// let jumpedRespawnTime = 0;
// let timetoJumpedRespawn = 0;
// let phaseTime = 0;
// let timeToPhase = 0;
// let respawnsRemaining = 0;
// let userAdjustment = parseInt(localStorage.getItem("userAdjustment")) || 0;
// let isJumped = false;
// let timeBetweenRespawn = 0;
let volume = 0;
// let clock = null;
let simpleUI = localStorage.getItem("simpleUI") == "true";

const clock = new RealClock(0);
//const clock = new SimulatedClock(20 * 60, 1);
const gameTimer = new GameTimer(clock, MODE1_STAGES, PHASE_TIMES);
const respawmTimer = new RespawnTimer(gameTimer, RESPAWN_TIMES, RESPAWN_INTERVALS, JUMP_ADJUSTMENT);
const caller = new Caller(respawmTimer, gameTimer);
let watcher = null

// -----------------------------------------------------------------------------
// UI Variables
// -----------------------------------------------------------------------------

let fontSizeNormalRespawn = parseFloat(localStorage.getItem("fontSizeNormalRespawn")) || 3;
let fontSizeJumpedRespawn = parseFloat(localStorage.getItem("fontSizeJumpedRespawn")) || 3;
let fontSizeRespawnInterval = parseFloat(localStorage.getItem("fontSizeRespawnInterval")) || 1;
let updateRate = parseInt(localStorage.getItem("updateRate")) || 1000;
let soundToggles = [
    (localStorage.getItem("sound0") == "true"),
    (localStorage.getItem("sound1") == "true"),
    (localStorage.getItem("sound2") == "true"),
    (localStorage.getItem("sound3") == "true"),
    (localStorage.getItem("sound10") == "true"),
    (localStorage.getItem("sound20") == "true"),
]

function formatTime(seconds) {
    const minutesRemaining = Math.floor(seconds / 60);
    const secondsRemaining = seconds % 60;
    return `${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')}`;
}

function formatAdjustmentTime(seconds) {
    const formattedTime = formatTime(Math.abs(seconds));
    const sign = seconds >= 0 ? "+" : "-";
    return sign + formattedTime;
}

function capitalizeFirst(str) {
    if (!str) return ''; // Handle empty or undefined strings
    return str.charAt(0).toUpperCase() + str.slice(1);
}


// -----------------------------------------------------------------------------
// Controls
// -----------------------------------------------------------------------------
const jumpedButton = document.getElementById("jumpButton");
const captureButtonA = document.getElementById("captureButtonA");
const captureButtonB = document.getElementById("captureButtonB");
const captureButtonC = document.getElementById("captureButtonC");
const altTimersCheck = document.getElementById("checkAltTimer");
const volumeSlider = document.getElementById("volumeSlider");
const nudgePlus = document.getElementById("adjustPlus");
const nudgeMinus = document.getElementById("adjustMinus");
const nudgeReset = document.getElementById("adjustReset");
const muteButton = document.getElementById("muteButton");
const saveButton = document.getElementById("saveButton");
const openModalButton = document.getElementById("openModal");
const simpleUICheckbox = document.getElementById("simpleUICheckbox");
const soundSlider = document.getElementById("soundVolume");

function OnJumpButtonClicked() {
    caller.toggleJump();


    updateDisplay();
}

function OnAltTimerCheckClicked() {
    if (altTimersCheck.checked) {
        gameTimer.changeStageTimes(MODE2_STAGES);
    } else {
        gameTimer.changeStageTimes(MODE1_STAGES);
    }
}

function OnVolumeSliderChanged(target) {
    const value = target.currentTarget.value;
    volume = value / 100.0;
    volumeSlider.value = value;
    soundSlider.value = value;
    updateSounds();

    if (volume <= 1e-3) {
        speakerIconElement.classList = SPEAKER_MUTE;
    } else if (volume <= 0.5) {
        speakerIconElement.classList = SPEAKER_VOL_LOW;
    } else {
        speakerIconElement.classList = SPEAKER_VOL_HIGH;
    }

}

function OnMuteButtonClicked() {
    if (volume <= 1e-3) {
        volume = .25
    } else {
        volume = 0;
    }
    volumeSlider.value = volume * 100;

    volumeSlider.dispatchEvent(new Event('input'));
}

function OnNudgeMinusClicked() {
    clock.nudge(-1);
    update();
}

function OnNudgePlusClicked() {
    clock.nudge(+1);
    update();
}

function OnNudgeResetClicked() {
    clock.resetNudge();
    update();
}

function OnWindowBeforeUnload() {
    localStorage.setItem("userAdjustment", clock.getAdjustment());
    localStorage.setItem("fontSizeNormalRespawn", fontSizeNormalRespawn);
    localStorage.setItem("fontSizeJumpedRespawn", fontSizeJumpedRespawn);
    localStorage.setItem("fontSizeRespawnInterval", fontSizeRespawnInterval);
    localStorage.setItem("simpleUI", simpleUI);
    localStorage.setItem("updatRate", updateRate);
    localStorage.setItem("sound0", soundToggles[0]);
    localStorage.setItem("sound1", soundToggles[1]);
    localStorage.setItem("sound2", soundToggles[2]);
    localStorage.setItem("sound3", soundToggles[3]);
    localStorage.setItem("sound10", soundToggles[4]);
    localStorage.setItem("sound20", soundToggles[5]);

}

function OnWindowLoad() {
    updateFontSizes();
}

function OneTimeRemainingElementWheel(event) {
    event.preventDefault(); // Prevent default scroll behavior if needed
    if (event.deltaY < 0) {
        userAdjustment += 1;
    } else if (event.deltaY > 0) {
        userAdjustment -= 1;
    }
    updateDisplay();
}

function OnSaveButtonClicked() {
    fontSizeNormalRespawn = parseFloat(document.getElementById("fontSizeNormalInput").value);
    fontSizeJumpedRespawn = parseFloat(document.getElementById("fontSizeJumpInput").value);
    fontSizeRespawnInterval = parseFloat(document.getElementById("fontSizeRespawnIntervalInput").value);
    updateRate = parseInt(document.getElementById("updateRateInput").value);
    simpleUI = simpleUICheckbox.checked;

    soundToggles[0] = document.getElementById("enableBeep0").checked;
    soundToggles[1] = document.getElementById("enableBeep1").checked;
    soundToggles[2] = document.getElementById("enableBeep2").checked;
    soundToggles[3] = document.getElementById("enableBeep3").checked;
    soundToggles[4] = document.getElementById("enableBeep10").checked;
    soundToggles[5] = document.getElementById("enableBeep20").checked;

    // const modalElement = document.getElementById('exampleModal');
    // modalElement.hide();
    updateFontSizes();
    updateSimpleUI();
    updateSounds();
}

function OnOpenModalButtonClicked() {
    document.getElementById("fontSizeNormalInput").value = `${fontSizeNormalRespawn}`;
    document.getElementById("fontSizeJumpInput").value = `${fontSizeJumpedRespawn}`;
    document.getElementById("fontSizeRespawnIntervalInput").value = `${fontSizeRespawnInterval}`;
    document.getElementById("updateRateInput").value = `${updateRate}`;
    document.getElementById("enableBeep0").checked = soundToggles[0];
    document.getElementById("enableBeep1").checked = soundToggles[1];
    document.getElementById("enableBeep2").checked = soundToggles[2];
    document.getElementById("enableBeep3").checked = soundToggles[3];
    document.getElementById("enableBeep10").checked = soundToggles[4];
    document.getElementById("enableBeep20").checked = soundToggles[5];
    simpleUICheckbox.checked = simpleUI;
    soundSlider.value = volume * 100;
}

function OnSimpleUICheckboxClicked() {

}

function OnRecordClicked() {
    if (mediaStream) {
        stopScreenCapture();
    } else {
        startScreenCapture();
    }
}

export async function onOpenCvReady() {
    window.cv = await window.cv;
}

function OnCaptureButtonClicked(target) {
    const isCapped = target.classList.contains('btn-primary')

    if (!isCapped) {
        if (target.id == captureButtonA.id) {
            caller.capture("A");
        } else if (target.id == captureButtonB.id) {
            caller.capture("B");
        } else if (target.id == captureButtonC.id) {
            caller.capture("C");
        }
        target.classList.remove('btn-secondary');
        target.classList.add('btn-primary');
    } else {
        if (target.id == captureButtonA.id) {
            caller.upcature("A");
        } else if (target.id == captureButtonB.id) {
            caller.upcature("B");
        } else if (target.id == captureButtonC.id) {
            caller.upcature("C");
        }
        target.classList.remove('btn-primary');
        target.classList.add('btn-secondary');
    }
}

function SetUpEventListeners() {
    jumpedButton.addEventListener('click', OnJumpButtonClicked);
    altTimersCheck.addEventListener('click', OnAltTimerCheckClicked);
    volumeSlider.addEventListener('input', OnVolumeSliderChanged)
    nudgeMinus.addEventListener('click', OnNudgeMinusClicked);
    nudgePlus.addEventListener('click', OnNudgePlusClicked);
    nudgeReset.addEventListener('click', OnNudgeResetClicked);
    muteButton.addEventListener('click', OnMuteButtonClicked);
    window.addEventListener('beforeunload', OnWindowBeforeUnload);
    window.addEventListener('DOMContentLoaded', OnWindowLoad);
    timeRemainingElement.addEventListener('wheel', OneTimeRemainingElementWheel);
    saveButton.addEventListener('click', OnSaveButtonClicked);
    openModalButton.addEventListener('click', OnOpenModalButtonClicked);
    simpleUICheckbox.addEventListener('click', OnSimpleUICheckboxClicked);
    captureButtonA.addEventListener('click', event => { OnCaptureButtonClicked(event.target); });
    captureButtonB.addEventListener('click', event => { OnCaptureButtonClicked(event.target); });
    captureButtonC.addEventListener('click', event => { OnCaptureButtonClicked(event.target); });
    soundSlider.addEventListener('input', OnVolumeSliderChanged);

}
// -----------------------------------------------------------------------------
// MVC
// -----------------------------------------------------------------------------
const stageElement = document.getElementById("stage")
const phaseElement = document.getElementById("phase");
const timeRemainingElement = document.getElementById("timeRemaining");
const nextPhaseTimeElement = document.getElementById("nextPhaseTime");
const timeToPhaseElement = document.getElementById("timeToPhase");
const nextRespawnTimeElement = document.getElementById("nextRespawnTime");
const timeToRespawnElement = document.getElementById("timeToRespawn");
const nextJumpedRespawnTimeElement = document.getElementById("nextJumpedRespawn");
const timeToJumpRespawnElement = document.getElementById("timeToRespawnJumped");
const countRespawnsElement = document.getElementById("countRespawns");
const respawnBoxElement = document.getElementById("respawnBox");
const jumpedBoxElement = document.getElementById("jumpedBox");
const timeBetweenRespawnElement = document.getElementById("timeBetweenRespawn");
const nudgeElement = document.getElementById("nudge");
const simpleUIRow = document.getElementById("simpleUIRow");

const beepAudio = document.getElementById("beep");
const respawnAudio = document.getElementById("respawn");
const tenSecondsAudio = document.getElementById("tenSeconds");
const twentySecondsAudio = document.getElementById("twentySeconds");

const speakerIconElement = document.getElementById("speakerIcon");
const arrowLeft = document.getElementById("arrowLeft");
const arrowRight = document.getElementById("arrowRight");

const SPEAKER_MUTE = "bi bi-volume-mute";
const SPEAKER_VOL_HIGH = "bi bi-volume-up";
const SPEAKER_VOL_LOW = "bi bi-volume-down";

const aduioElements = [beepAudio, respawnAudio, tenSecondsAudio, twentySecondsAudio];

function updateArrows() {
    if (respawmTimer.isJumped()) {
        arrowLeft.classList = '';
        arrowRight.classList = 'bi bi-arrow-right arrow'
    } else {
        arrowLeft.classList = 'bi bi-arrow-left arrow';
        arrowRight.classList = '';
    }
}
function updateDisplay() {
    // Update stage and time
    stageElement.textContent = capitalizeFirst(gameTimer.getStage());
    timeRemainingElement.textContent = formatTime(gameTimer.getTimeRemainingInStage());
    nudgeElement.textContent = formatAdjustmentTime(clock.getAdjustment());

    if (gameTimer.getStage() === STAGES.WAR) {
        updatePhaseInfo();
        updateRespawnInfo();
        updateJumpedState();
        updateArrows();
        updateRespawnInterval();

        // Toggle visibility of controls
        toggleControlsVisibility(true);
    } else {
        toggleControlsVisibility(false);
    }
}

function updatePhaseInfo() {
    phaseElement.textContent = `Phase ${gameTimer.getPhase()} of ${gameTimer.getNumberOfPhases()}`;
    const timeToPhase = gameTimer.getTimeRemainingInPhase();
    nextPhaseTimeElement.textContent = formatTime(gameTimer.getPhaseTime());
    timeToPhaseElement.textContent = formatTime(Math.max(0, timeToPhase));
}

function updateRespawnInfo() {
    const nextNormalRespawn = respawmTimer.getNextNormalRespawn();
    if (nextNormalRespawn > 0) {
        nextRespawnTimeElement.textContent = formatTime(nextNormalRespawn);
        timeToRespawnElement.textContent = formatTime(respawmTimer.getTimeToNormalRespawn());
        nextJumpedRespawnTimeElement.textContent = formatTime(respawmTimer.getNextJumpedRespawn());
        timeToJumpRespawnElement.textContent = formatTime(respawmTimer.getTimeToJumpedRespawn());
    } else {
        nextRespawnTimeElement.textContent = NO_RESPAWNS_REMAINING;
        timeToRespawnElement.textContent = "0:00";
        nextJumpedRespawnTimeElement.textContent = NO_RESPAWNS_REMAINING;
        timeToJumpRespawnElement.textContent = "0:00";
    }
    countRespawnsElement.textContent = respawmTimer.getRespawnsLeftInPhase();
}

function updateJumpedState() {
    const isJumped = respawmTimer.isJumped();
    respawnBoxElement.classList.toggle("disabled", isJumped);
    jumpedBoxElement.classList.toggle("disabled", !isJumped);
    jumpedButton.textContent = isJumped ? "Switch to Normal" : "Switch to Jumped";

    // if (respawnTime > 0 && respawnTime <= 3) {
    //     beepAudio.play();
    // } else if (respawnTime === 0) {
    //     respawnAudio.play();
    // }
}

function updateRespawnInterval() {
    const interval = respawmTimer.getRespawnInterval();
    timeBetweenRespawnElement.textContent = interval > 0 ? `${interval}s` : "";
}

function toggleControlsVisibility(isWar) {
    const controls = [
        phaseElement, nextPhaseTimeElement, timeToPhaseElement,
        nextRespawnTimeElement, timeToRespawnElement,
        nextJumpedRespawnTimeElement, countRespawnsElement,
        timeToJumpRespawnElement, timeBetweenRespawnElement,
        arrowLeft, arrowRight, jumpedButton
    ];

    controls.forEach(control => setControlVisibility(control, isWar));
}


function disableControls() {
    nudgeMinus.classList.add("disabled");
    nudgePlus.classList.add("disabled");
    nudgeReset.classList.add("disabled");
    jumpedButton.classList.add("disababled");
}

function enableControls() {
    nudgeMinus.classList.remove("disabled");
    nudgePlus.classList.remove("disabled");
    nudgeReset.classList.remove("disabled");
    jumpedButton.classList.remove("disababled");
}


function hideControl(control) {
    control.classList.add("invisible");
}

function showControl(control) {
    control.classList.remove("invisible");
}

function update() {
    updateDisplay();
    if (gameTimer.getStage() == STAGES.WAR) {
        soundsManager.forEach(element => { element.update(); });
    }
    caller.update();
}

function updateFontSizes() {
    timeToRespawnElement.style.fontSize = `${fontSizeNormalRespawn}rem`;
    timeToJumpRespawnElement.style.fontSize = `${fontSizeJumpedRespawn}rem`;
    timeBetweenRespawnElement.style.fontSize = `${fontSizeRespawnInterval}rem`;
}

function updateSimpleUI() {
    if (!simpleUIRow) return;
    if (simpleUI) {
        simpleUIRow.classList.remove('invisible');
    } else {
        simpleUIRow.classList.add('invisible');
    }
    caller.manual = !simpleUI;
}

function updateSounds() {
    aduioElements.forEach(element => { element.volume = volume; });
    for (let i = 0; i < soundsManager.length; i++) {
        soundsManager[i].disabled = !soundToggles[i];
    }
}

function setControlVisibility(control, isVisible) {
    if (isVisible) {
        showControl(control);
    } else {
        hideControl(control);
    }
}


//clock = new SimulatedClock(20 * 60, 1);
//clock = new ManualClock();
const soundsManager = [
    new SoundNotifications(respawmTimer, 0, respawnAudio),
    new SoundNotifications(respawmTimer, 1, beepAudio),
    new SoundNotifications(respawmTimer, 2, beepAudio),
    new SoundNotifications(respawmTimer, 3, beepAudio),
    new SoundNotifications(respawmTimer, 10, tenSecondsAudio),
    new SoundNotifications(respawmTimer, 20, twentySecondsAudio),
]
updateSounds();
speakerIconElement.classList = SPEAKER_MUTE;

updateSimpleUI();
SetUpEventListeners();
setInterval(update, updateRate);
update(); // Initialize immediately

const loadOpenCvScript = () => {
    const script = document.createElement('script');
    script.src = './static/scripts/opencv.js'; // Adjust path to opencv.js
    script.onload = onOpenCvReady;  // This will now call onOpenCvReady once opencv.js is loaded
    document.body.appendChild(script);
};

// Call the function to load OpenCV.js
window.onOpenCvReady = onOpenCvReady;
