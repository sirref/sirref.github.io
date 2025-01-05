// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const STAGES = Object.freeze({
    BREAK: 'break',
    PREP: 'prep',
    WAR: 'war'
});

const PHASES = Object.freeze({
    PHASE1: 1,
    PHASE2: 2,
    PHASE3: 3,
    PHASE4: 4,
    PHASE5: 5,
    PHASE6: 6,
    NONE: 0,
});

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

const TIME_BETWEEN_RESPAWNS = [20, 28, 36, 44, 52, 60];

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

// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------
let mode = MODE1_STAGES
let stage = STAGES.BREAK;
let phase = 0;
let captureTimes = [];
let timeRem = 0;
let respawnTime = 0;
let timeToRespawn = 0;
let jumpedRespawnTime = 0;
let timetoJumpedRespawn = 0;
let phaseTime = 0;
let timeToPhase = 0;
let respawnsRemaining = 0;
let userAdjustment = parseInt(localStorage.getItem("userAdjustment")) || 0;
let isJumped = false;
let timeBetweenRespawn = 0;
let volume = 0;
let clock = null;

// -----------------------------------------------------------------------------
// UI Variables
// -----------------------------------------------------------------------------

let fontSizeNormalRespawn = parseFloat(localStorage.getItem("fontSizeNormalRespawn")) || 3;
let fontSizeJumpedRespawn = parseFloat(localStorage.getItem("fontSizeJumpedRespawn")) || 3;
let fontSizeRespawnInterval = parseFloat(localStorage.getItem("fontSizeRespawnInterval")) || 1;

// -----------------------------------------------------------------------------
// Logic
// -----------------------------------------------------------------------------
class SimulatedClock {
    constructor(startTime) {
        this.startTime = startTime
    }

    now() {
        return this.startTime++ + userAdjustment;
    }
}

class RealClock {
    constructor() { }
    now() {
        const now = new Date();
        return now.getMinutes() * 60 + now.getSeconds() + userAdjustment;
    }
}

class ManualClock {
    constructor() {
        this.time = 0;
    }
    now() {
        return this.time + userAdjustment;
    }
    forward() {
        this.time += 1;
    }
    back() {
        this.time -= 1;
    }
}

function getCurrentTimeInSeconds() {
    // const now = new Date();
    // return now.getMinutes() * 60 + now.getSeconds() + userAdjustment;
    return clock.now();
}

function getCurrentStage(secondsIntoHour) {
    if (mode.PREP_START <= secondsIntoHour && secondsIntoHour < mode.PREP_END) {
        return STAGES.PREP;
    } else if (mode.WAR_START <= secondsIntoHour && secondsIntoHour < mode.WAR_END) {
        return STAGES.WAR;
    } else {
        return STAGES.BREAK;
    }
}

function getCurrentPhase(timeRemaining) {
    for (let i = 0; i < PHASE_TIMES.length; i++) {
        if (PHASE_TIMES[i] < timeRemaining) {
            return PHASES[`PHASE${i + 1}`];
        }
    }
    return PHASES.PHASE6;
}

function getPhaseTime(timeRemaining) {
    const phase = getCurrentPhase(timeRemaining);
    return PHASE_TIMES[phase - 1] || 0;
}

function getTimeBetweenRespawns(phase) {
    if (phase < TIME_BETWEEN_RESPAWNS.length) {
        return TIME_BETWEEN_RESPAWNS[phase - 1];
    }
    return 0;
}

function getTimeRemainingInStage(secondsIntoHour, stage) {
    if (stage == STAGES.PREP) {
        return mode.PREP_END - secondsIntoHour;
    } else if (stage == STAGES.WAR) {
        return mode.WAR_END - secondsIntoHour;
    } else if (stage == STAGES.BREAK) {
        return mode.BREAK_END - secondsIntoHour;
    }
}

function getNumberRespawnsRemainingInPhase(timeRemaining) {
    const phase = getCurrentPhase(timeRemaining);
    // Find the current phase based on the time remaining
    let currentPhaseIndex = phase - 1;

    // If no phase matches, return 0 (no respawns left)
    if (currentPhaseIndex === -1) return 0;

    // Get the start and end times of the current phase
    const phaseEnd = PHASE_TIMES[currentPhaseIndex];

    // Count respawns within the current phase and still valid for timeRemaining
    return RESPAWN_TIMES.filter(
        (time) => time < timeRemaining && time >= phaseEnd
    ).length;
}

function getNextRespawnTime(timeRemaining) {
    for (let i = 0; i < RESPAWN_TIMES.length; i++) {
        if (RESPAWN_TIMES[i] <= timeRemaining) {
            return RESPAWN_TIMES[i];
        }
    }
    // If no respawn time is less than timeRemaining, return null or a message
    return -1;
}

function getNextJumpedRespawnTime(timeRemaining, phase) {
    const normalRespawnTime = getNextRespawnTime(timeRemaining);
    if (phase == PHASES.PHASE1) {
        return normalRespawnTime;
    }

    if (isLastRespawnInPhase(timeRemaining, phase)) {
        return normalRespawnTime;
    }

    if (timeRem - normalRespawnTime >= JUMP_ADJUSTMENT) {
        return normalRespawnTime + JUMP_ADJUSTMENT;
    }

    const nextRespawnTime = getNextRespawnTime(normalRespawnTime - 1);
    return nextRespawnTime + JUMP_ADJUSTMENT;
}

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

function updateAudioVolume(value) {
    const newVolume = value / 100.0;
}

function isLastRespawnInPhase(timeRemaining, phase) {
    const timeBetween = getTimeBetweenRespawns(phase);
    const phaseTime = getPhaseTime(timeRemaining);

    const timeToPhase = timeRemaining - phaseTime;

    return timeToPhase <= JUMP_ADJUSTMENT;
}

// -----------------------------------------------------------------------------
// Controls
// -----------------------------------------------------------------------------
const jumpedButton = document.getElementById("jumpButton");
const altTimersCheck = document.getElementById("checkAltTimer");
const volumeSlider = document.getElementById("volumeSlider");
const nudgePlus = document.getElementById("adjustPlus");
const nudgeMinus = document.getElementById("adjustMinus");
const nudgeReset = document.getElementById("adjustReset");
const muteButton = document.getElementById("muteButton");
const saveButton = document.getElementById("saveButton");
const openModalButton = document.getElementById("openModal");

function OnJumpButtonClicked() {
    isJumped = !isJumped;

    if (isJumped) {
        jumpedButton.textContent = "Switch to Normal";
        respawnBoxElement.classList.add("disabled");
        jumpedBoxElement.classList.remove("disabled");
    } else {
        jumpedButton.textContent = "Switch to Jumped";
        respawnBoxElement.classList.remove("disabled");
        jumpedBoxElement.classList.add("disabled");
    }
    updateDisplay();
}

function OnAltTimerCheckClicked() {
    if (altTimersCheck.checked) {
        mode = MODE2_STAGES;
    } else {
        mode = MODE1_STAGES;
    }

    //console.log("Mode changed: " + JSON.stringify(mode));
}

function OnVolumeSliderChanged() {
    volume = volumeSlider.value / 100.0;
    beepAudio.volume = volume;
    respawnAudio.volume = volume;

    //console.log(beepAudio.volume);
    //console.log(respawnAudio.volume);

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
    userAdjustment -= 1;
    update();
}

function OnNudgePlusClicked() {
    userAdjustment += 1;
    update();
}

function OnNudgeResetClicked() {
    userAdjustment = 0;
    update();
}

function OnWindowBeforeUnload() {
    localStorage.setItem("userAdjustment", userAdjustment);
    localStorage.setItem("fontSizeNormalRespawn", fontSizeNormalRespawn);
    localStorage.setItem("fontSizeJumpedRespawn", fontSizeJumpedRespawn);
    localStorage.setItem("fontSizeRespawnInterval", fontSizeRespawnInterval);
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
    fontSizeNormalRespawn = parseFloat(document.getElementById("fontSizeNormalInput").value, 3);
    fontSizeJumpedRespawn = parseFloat(document.getElementById("fontSizeJumpInput").value, 3);
    fontSizeRespawnInterval = parseFloat(document.getElementById("fontSizeRespawnIntervalInput").value, 1);
    // const modalElement = document.getElementById('exampleModal');
    // modalElement.hide();
    updateFontSizes();
}

function OnOpenModalButtonClicked() {
    document.getElementById("fontSizeNormalInput").value = `${fontSizeNormalRespawn}`;
    document.getElementById("fontSizeJumpInput").value = `${fontSizeJumpedRespawn}`;
    document.getElementById("fontSizeRespawnIntervalInput").value = `${fontSizeRespawnInterval}`;
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
const nudgeElement = document.getElementById("nudge")

const beepAudio = document.getElementById("beep");
const respawnAudio = document.getElementById("respawn");
const speakerIconElement = document.getElementById("speakerIcon");
const arrowLeft = document.getElementById("arrowLeft");
const arrowRight = document.getElementById("arrowRight");

const SPEAKER_MUTE = "bi bi-volume-mute";
const SPEAKER_VOL_HIGH = "bi bi-volume-up";
const SPEAKER_VOL_LOW = "bi bi-volume-down";
const ARROW_LEFT = "bi bi-arrow-left arrow"
const ARROW_RIGHT = "bi bi-arrow-right arrow"

function updatePhase(timeRemaining) {
    const newPhase = getCurrentPhase(timeRemaining);

    if (isJumped && newPhase != phase) {
        jumpedButton.click();
    }

    phase = newPhase;

    phaseTime = getPhaseTime(timeRemaining);
    timeToPhase = timeRem - phaseTime;
}

function updateRespawn(timeRemaining) {
    respawnTime = getNextRespawnTime(timeRem);
    timeToRespawn = respawnTime > 0 ? timeRem - respawnTime : -1;
    jumpedRespawnTime = getNextJumpedRespawnTime(timeRem, phase);
    timetoJumpedRespawn = Math.max(timeRem - jumpedRespawnTime, 0);
    respawnsRemaining = getNumberRespawnsRemainingInPhase(timeRem);
    timeBetweenRespawn = getTimeBetweenRespawns(phase);
}

function updateModel() {
    const timeInSeconds = getCurrentTimeInSeconds();
    stage = getCurrentStage(timeInSeconds);
    timeRem = getTimeRemainingInStage(timeInSeconds, stage);

    updatePhase(timeRem);
    updateRespawn(timeRem);
}

function updateArrows() {
    if (isJumped) {
        arrowLeft.classList = "";
        arrowRight.classList = ARROW_RIGHT;
    } else {
        arrowLeft.classList = ARROW_LEFT;
        arrowRight.classList = "";
    }
}
function updateDisplay() {
    stageElement.textContent = `${capitalizeFirst(stage)}`;
    timeRemainingElement.textContent = `${formatTime(timeRem)}`;
    nudgeElement.textContent = `${formatAdjustmentTime(userAdjustment)}`;

    if (stage == STAGES.WAR) {
        phaseElement.textContent = `Phase ${phase} of ${PHASE_TIMES.length}`;

        if (timeToPhase > 0) {
            nextPhaseTimeElement.textContent = `${formatTime(phaseTime)}`;
            timeToPhaseElement.textContent = `${formatTime(timeToPhase)}`;
        } else {
            nextPhaseTimeElement.textContent = `${formatTime(0)}`;
            timeToPhaseElement.textContent = `${formatTime(0)}`;
        }

        if (respawnTime > 0) {
            nextRespawnTimeElement.textContent = `${formatTime(respawnTime)}`;
            timeToRespawnElement.textContent = `${formatTime(timeToRespawn)}`;
            nextJumpedRespawnTimeElement.textContent = `${formatTime(jumpedRespawnTime)}`;
            timeToJumpRespawnElement.textContent = `${formatTime(timetoJumpedRespawn)}`;
        } else {
            nextRespawnTimeElement.textContent = NO_RESPAWNS_REMAINING;
            timeToRespawnElement.textContent = "0:00"
            nextJumpedRespawnTimeElement.textContent = NO_RESPAWNS_REMAINING;
            timeToJumpRespawnElement.textContent = "0:00";
        }
        countRespawnsElement.textContent = `${respawnsRemaining}`;

        if (isJumped) {
            respawnBoxElement.classList.add("disabled");
            jumpedBoxElement.classList.remove("disabled");
            if (0 < timetoJumpedRespawn && timetoJumpedRespawn <= 3) {
                beepAudio.play();
            } else if (timetoJumpedRespawn == 0) {
                respawnAudio.play();
            }
        } else {
            respawnBoxElement.classList.remove("disabled");
            jumpedBoxElement.classList.add("disabled");
            if (0 < timeToRespawn && timeToRespawn <= 3) {
                beepAudio.play();
            } else if (timeToRespawn == 0) {
                respawnAudio.play();
            }
        }
        updateArrows();
        if (timeBetweenRespawn > 0) {
            timeBetweenRespawnElement.textContent = `${timeBetweenRespawn}s`;
        } else {
            timeBetweenRespawnElement.textContent = "";
        }


        showControl(phaseElement);
        showControl(nextPhaseTimeElement);
        showControl(timeToPhaseElement);
        showControl(nextRespawnTimeElement);
        showControl(timeToRespawnElement);
        showControl(nextJumpedRespawnTimeElement);
        showControl(countRespawnsElement);
        showControl(timeToJumpRespawnElement);
        showControl(timeBetweenRespawnElement);
        showControl(arrowLeft);
        showControl(arrowRight);
        showControl(jumpedButton);
    } else {
        hideControl(phaseElement);
        hideControl(nextPhaseTimeElement);
        hideControl(timeToPhaseElement);
        hideControl(nextRespawnTimeElement);
        hideControl(timeToRespawnElement);
        hideControl(nextJumpedRespawnTimeElement);
        hideControl(countRespawnsElement);
        hideControl(timeToJumpRespawnElement);
        hideControl(timeBetweenRespawnElement);
        hideControl(arrowLeft);
        hideControl(arrowRight);
        hideControl(jumpedButton);
    }

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
    updateModel();
    updateDisplay();
}

function updateFontSizes() {
    timeToRespawnElement.style.fontSize = `${fontSizeNormalRespawn}rem`;
    timeToJumpRespawnElement.style.fontSize = `${fontSizeJumpedRespawn}rem`;
    timeBetweenRespawnElement.style.fontSize = `${fontSizeRespawnInterval}rem`;
}

//clock = new SimulatedClock(20 * 60);
//clock = new ManualClock();
clock = new RealClock();

beepAudio.volume = volume
respawnAudio.volume = volume;
speakerIconElement.classList = SPEAKER_MUTE;

SetUpEventListeners();
setInterval(update, 1000);
update(); // Initialize immediately
