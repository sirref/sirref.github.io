import { GSDB } from "./gsdb.js";

const sheetId = "14byZyCAX_N_AA-y_1tv4CLtgTCaOB-Zq8QbOHmavE6Y";
const lbSheetName = "leaderboards";
const lbdb = new GSDB(sheetId, lbSheetName);
const warDb = new GSDB(sheetId, "wars")

const leadboardQuery = "SELECT D, B, E, F, G, H, I, J, K where C={warId}";
const TABLE_HEADER = ["rank", "name", "score", "kills", "deaths", "assists", "healing", "damage", "team"];
const warsQuery = "SELECT A, B, C, D, E"

// Convert array of arrays into array of objects
function dataAsRecords(data) {
    return data.map(row =>
        Object.fromEntries(TABLE_HEADER.map((key, i) => [key, row[i]]))
    );
}

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


// Use an async function to await data
async function setupTable(data) {
    const tabulatorData = dataAsRecords(data);

    new Tabulator("#example-table", {
        data: tabulatorData,
        layout: "fitColumns",
        columns: TABLE_HEADER.map(key => ({
            title: key.charAt(0).toUpperCase() + key.slice(1),
            field: key
        }))
    });
}

const warDropdown = document.getElementById("war-select");

async function loadWars() {
    let data = await warDb.query(warsQuery);
    data.reverse();
    data.forEach(row => {
        const [id, date, territory, attacker, defender] = row;
        const gsDate = formatDateToMMDDYYYY(parseDateString(date));
        const label = `${gsDate} • ${territory} • ${attacker} vs ${defender}`;
        const option = document.createElement("option");
        option.value = id;
        option.textContent = label;
        warDropdown.appendChild(option);
    });
}

async function onWarDropdownChange(event) {
    const warId = event.target.value;
    const data = await lbdb.query(leadboardQuery.replace("{warId}", warId));
    setupTable(data);
}

function setUpListeners() {
    warDropdown.addEventListener("change", onWarDropdownChange)
}

setUpListeners();
loadWars();
