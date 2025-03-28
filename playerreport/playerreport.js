import { GSDB } from "../gsdb.js";

const sheetId = "14byZyCAX_N_AA-y_1tv4CLtgTCaOB-Zq8QbOHmavE6Y";
const leaderboardsSheet = "leaderboards";
const warsSheet = "wars";
const playersSheet = "players";
const db = new GSDB(sheetId);
const TABLE_HEADER = ["rank", "name", "score", "kills", "deaths", "assists", "healing", "damage", "company", "warid"];
const WARS_TABLE_HEADERS = [
    {
        title: "Date",
        field: "date",
        formatter: cell => formatDateToMMDDYYYY(cell.getValue())
    },
    {
        title: "Opponent",
        field: "opponent",
    },
    {
        title: "Territory",
        field: "territory"
    },
    {
        title: "Rank",
        field: "rank",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })
    },
    {
        title: "Score",
        field: "score",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })
    },
    {
        title: "Kills",
        field: "kills",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })
    },
    {
        title: "Deaths",
        field: "deaths",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })
    },
    {
        title: "Assists",
        field: "assists",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })
    },
    {
        title: "Healing",
        field: "healing",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })
    },
    {
        title: "Damage",
        field: "damage",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })
    },
    {
        title: "Company",
        field: "company"
    },
    {
        title: "Win/Loss",
        field: "win"
    }
];

function parseDateString(date_string) {
    // Match the Date string pattern "Date(year, month, day)"
    const regex = /Date\((\d{4}),(\d{1,2}),(\d{1,2})\)/;
    const matches = date_string.match(regex);

    if (matches) {
        const year = parseInt(matches[1], 10);
        const month = parseInt(matches[2], 10);  // Month is 0-based in JavaScript
        const day = parseInt(matches[3], 10);

        // Return a new Date object
        return new Date(year, month, day);
    } else {
        // Return null if the string doesn't match the Date format
        console.error("Invalid date string format");
        return null;
    }
}

function formatDateToMMDDYYYY(date) {
    const month = date.getMonth() + 1;  // Months are zero-based, so add 1
    const day = date.getDate();
    const year = date.getFullYear();

    // Pad month and day with leading zeros if needed (e.g., 03/09/2024)
    const formattedMonth = month < 10 ? `0${month}` : month;
    const formattedDay = day < 10 ? `0${day}` : day;

    return `${formattedMonth}/${formattedDay}/${year}`;
}

// Convert array of arrays into array of objects
function dataAsRecords(data) {
    return data.map(row =>
        Object.fromEntries(TABLE_HEADER.map((key, i) => [key, row[i]]))
    );
}

// Use an async function to await data
async function setupTable() {

    new Tabulator("#example-table", {
        data: tabulatorData,
        layout: "fitColumns",
        columns: TABLE_HEADER.map(key => ({
            title: key.charAt(0).toUpperCase() + key.slice(1),
            field: key
        }))
    });
}

async function getDataForPlayer(name) {
    let data = await db.query(leaderboardsSheet, `SELECT D, B, E, F, G, H, I, J, K, C WHERE B="${name}"`);
    return dataAsRecords(data);
}

async function getDataForWar() {
    let data = await db.query(warsSheet, `SELECT A, B, C, D, E, F, G, H, I`);
    return data;
}


function getWarInfo(warId, warsData) {
    for (let row of warsData) {
        if (row[0] == warId) {
            return row;
        }
    }
    return null;
}

function getOpponent(playerCompany, warInfo) {
    if (playerCompany == warInfo[3]) {
        return warInfo[4];
    } else if (playerCompany == warInfo[4]) {
        return warInfo[3];
    }
    return "";
}


function addWarInfoToPlayerData(playerData, warsData) {
    for (let row of playerData) {
        let warInfo = getWarInfo(row.warid, warsData);
        if (row.warid) {
            row.opponent = getOpponent(row.company, warInfo);
            row.date = parseDateString(warInfo[1]);
            row.win = warInfo[7];
            row.duration = warInfo[8];
            row.territory = warInfo[2];
        }
    }
}

async function onPlayerSelectChanged(params) {
    const data = await getDataForPlayer(params);
    const warsData = await getDataForWar();
    addWarInfoToPlayerData(data, warsData);
    new Tabulator("#wars-table", {
        data: data,
        layout: "fitColumns",
        columns: WARS_TABLE_HEADERS,
        rowFormatter: (row) => {
            const rowData = row.getData(); // Get the data for the row
            const winStatus = rowData.win.toLowerCase(); // Check if the row has "win" or "loss"

            if (winStatus === "win") {
                // Add a slight green background for wins
                row.getElement().style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            } else if (winStatus === "loss") {
                // Add a slight red background for losses
                row.getElement().style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            }
        }
    });
}
let playerDrowndown = null;
async function fillPlayerSelect() {

    let players = await db.query(playersSheet, "SELECT A");
    playerDrowndown = new TomSelect('#player-select', {
        create: false,
        sortField: {
            field: "text",
            direction: "asc"
        },
        onChange: value => { onPlayerSelectChanged(value); }
    });
    players.forEach(row => {
        const name = row[0];
        playerDrowndown.addOption({ value: name, text: name });
    });
    playerDrowndown.refreshOptions(false); // Refresh without re-sorting
}

async function parseArgs() {
    const params = new URLSearchParams(window.location.search);
    return {
        player: params.get('player')
    };
}

async function setPlayer() {
    const args = await parseArgs();
    if (args.player) {
        const options = playerDrowndown.options;
        for (let key in options) {
            if (options[key].text.toLowerCase().includes(args.player.toLowerCase())) {
                playerDrowndown.setValue(key);
            }
        }
    }
}
await fillPlayerSelect();
setPlayer();
//setupTable();
