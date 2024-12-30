// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const STAGES = Object.freeze({
    BREAK: 'break',
    PREP: 'prep',
    WAR: 'war'
});

const PHASES = Object.freeze({
    NONE: "0",
    PHASE1: "1",
    PHASE2: "2",
    PHASE3: "3",
    PHASE4: "4",
    PHASE5: "5",
    PHASE6: "6"
});

const RESPAWN_TIMES = [
    1780, 1760, 1740, 1720, 1700, 1680, 1660, 1640, 1620, 1600,
    1580, 1560, 1540, 1520, 1500, 1492, 1464, 1436, 1408, 1380,
    1352, 1324, 1296, 1268, 1240, 1212, 1184, 1148, 1112, 1076,
    1040, 1004, 968, 932, 896, 860, 816, 772, 728, 684,
    640, 596, 550, 498, 446, 394, 342, 290, 230, 170,
    110, 50
];

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
    PREP_START: 2700,
    PREP_END: 900,
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

// -----------------------------------------------------------------------------
// Logic
// -----------------------------------------------------------------------------
function getCurrentTimeInSeconds() {
    const now = new Date();
    return now.getMinutes() * 60 + now.getSeconds();
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
    return PHASES.NONE;
}


function getTimeRemainingInStage(secondsIntoHour) {
    const stage = getCurrentStage(secondsIntoHour)
    if (stage == STAGES.PREP) {
        return mode.PREP_END - secondsIntoHour;
    } else if (stage == STAGES.WAR) {
        return mode.WAR_END - secondsIntoHour;
    } else if (stage == STAGES.BREAK) {
        return mode.BREAK_END - secondsIntoHour;
    }
}

function getNextRespawnTime(timeRemaining) {
    for (let i = 0; i < RESPAWN_TIMES.length; i++) {
        if (RESPAWN_TIMES[i] < timeRemaining) {
            return RESPAWN_TIMES[i];
        }
    }
    // If no respawn time is less than timeRemaining, return null or a message
    return -1;
}

function formatTime(seconds) {
    const minutesRemaining = Math.floor(seconds / 60);
    const secondsRemaining = seconds % 60;
    return `${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')}`;
}

function capitalizeFirst(str) {
    if (!str) return ''; // Handle empty or undefined strings
    return str.charAt(0).toUpperCase() + str.slice(1);
}
// -----------------------------------------------------------------------------
// MVC
// -----------------------------------------------------------------------------
const stageElement = document.getElementById("stage")
const phaseElement = document.getElementById("phase");
const timeRemainingElement = document.getElementById("timeRemaining");
const nextRespawnTimeElement = document.getElementById("nextRespawnTime")
const timeToRespawnElement = document.getElementById("timeToRespawn")

function updateModel() {
    const timeInSeconds = getCurrentTimeInSeconds();
    stage = getCurrentStage(timeInSeconds);
    timeRem = getTimeRemainingInStage(timeInSeconds);

    phase = getCurrentPhase(timeRem);
    respawnTime = getNextRespawnTime(timeRem);
    timeToRespawn = respawnTime > 0 ? timeRem - respawnTime : -1;

}

function updateDisplay() {
    stageElement.textContent = `${capitalizeFirst(stage)}`;
    timeRemainingElement.textContent = `${formatTime(timeRem)}`;

    if (stage == STAGES.WAR) {
        phaseElement.textContent = `${capitalizeFirst(phase)}`;
        if (respawnTime > 0) {
            nextRespawnTimeElement.textContent = `${formatTime(respawnTime)}`;
            timeToRespawnElement.textContent = `${formatTime(timeToRespawn)}`;
        } else {
            nextRespawnTimeElement.textContent = NO_RESPAWNS_REMAINING;
            timeToRespawnElement.textContent = ""
        }
    } else {
        phaseElement.textContent = ""
        nextRespawnTimeElement.textContent = "";
        timeToRespawnElement.textContent = "";
    }

}

function update() {
    updateModel();
    updateDisplay();
}



setInterval(update, 1000);
update(); // Initialize immediately
