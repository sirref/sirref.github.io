import { GSDB } from "./gsdb.js";

const sheetId = "14byZyCAX_N_AA-y_1tv4CLtgTCaOB-Zq8QbOHmavE6Y";
const leadboardSheet = "leaderboards"
const warSheet = "wars"
const companiesSheet = "companies"
const groupsSheet = "groups"
const db = new GSDB(sheetId);

const COMPANIES = await db.query(companiesSheet, "SELECT A, B WHERE A IS NOT NULL");

const leadboardQuery = "SELECT D, B, E, F, G, H, I, J, K where C={warId}";
const TABLE_HEADER = ["rank", "name", "score", "kills", "deaths", "assists", "healing", "damage", "company"];
const SUMMARY_HEADER = ["company", "kills", "deaths", "assists", "healing", "damage", "dpk", "apk"];
const warsQuery = "SELECT A, B, C, D, E"
let leaderboardTable = null;
const COVENANT_STYLE = { background: "goldenrod", color: "black" };
const MARAUDER_STYLE = { background: "#38761d", color: "white" };
const SYNDICATE_STYLE = { background: "#674ea7", color: "white" };
const NULL_GROUPS = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
    10: null,
    11: null,
    12: null
}

const STYLES = { "Covenant": COVENANT_STYLE, "Marauder": MARAUDER_STYLE, "Syndicate": SYNDICATE_STYLE };
const LEADERBOARD_COLUMNS = [
    { title: "Rank", field: "rank" },
    { title: "Name", field: "name" },
    {
        title: "Score",
        field: "score",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })
    },
    { title: "Kills", field: "kills" },
    { title: "Deaths", field: "deaths" },
    { title: "Assists", field: "assists" },
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
        title: "KP",
        field: "kpar",
        formatter: cell => cell.getValue().toLocaleString(undefined, {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    },
    { title: "Company", field: "company" },
];

const SUMMARY_COLUMNS = [
    { title: "Company", field: "company" },
    { title: "Players", field: "players" },
    { title: "Kills", field: "kills" },
    { title: "Deaths", field: "deaths" },
    {
        title: "Assists",
        field: "assists",
        formatter: cell => cell.getValue().toLocaleString()
    },
    {
        title: "Healing",
        field: "healing",
        formatter: cell => cell.getValue().toLocaleString()
    },
    {
        title: "Damage",
        field: "damage",
        formatter: cell => cell.getValue().toLocaleString()
    },
    {
        title: "DPK",
        field: "dpk",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })
    },
    {
        title: "APK",
        field: "apk",
        formatter: cell => cell.getValue().toFixed(2)
    }
];

const GROUPS_SUMMARY_COLUMNS = []

const GROUPS_COLUMNS = [
    { title: "Name", field: "name" },
    {
        title: "Score",
        field: "score",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 }),
        bottomCalc: bottomCalcFunction,
        bottomCalcParams: { function: "sum" }
    },
    {
        title: "Kills",
        field: "kills",
        bottomCalc: bottomCalcFunction,
        bottomCalcParams: { function: "sum" }
    },
    {
        title: "Deaths",
        field: "deaths",
        bottomCalc: bottomCalcFunction,
        bottomCalcParams: { function: "sum" }
    },
    {
        title: "Assists",
        field: "assists",
        bottomCalc: bottomCalcFunction,
        bottomCalcParams: { function: "sum" }
    },
    {
        title: "Healing",
        field: "healing",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 }),
        bottomCalc: bottomCalcFunction,
        bottomCalcParams: { function: "sum" }
    },
    {
        title: "Damage",
        field: "damage",
        formatter: cell => cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 }),
        bottomCalc: bottomCalcFunction,
        bottomCalcParams: { function: "sum" }
    },
    {
        title: "KP",
        field: "kpar",
        formatter: cell => cell.getValue().toLocaleString(undefined, {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
        bottomCalc: bottomCalcFunction,
        bottomCalcParams: { function: "mean" }
    }
];

function bottomCalcFunction(values, data, calcParams) {
    let value = 0;
    const fn = calcParams["function"]
    if (fn == "sum") {
        value = bottomCalcSum(values, data, calcParams);
        return value.toLocaleString();
    } else if (fn == "mean") {
        value = bottomCalcMean(values, data, calcParams);
        return value.toLocaleString(undefined, {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
}

function bottomCalcSum(values, data, calcParams) {
    var sum = 0;
    values.forEach(v => { sum += typeof v === "number" ? v : 0; });
    return sum
}

function bottomCalcMean(values, data, calcParams) {
    if (values.length > 0) {
        return bottomCalcSum(values, data, calcParams) / values.length;
    }
    return 0;
}

function getCompanyFaction(companies, company) {
    for (let entry of companies) {
        if (entry[0] == company) {  // Compare entry[0] with the company parameter
            return entry[1];  // Return the faction associated with the company
        }
    }
    return null;  // Return null if company is not found
}

// Convert array of arrays into array of objects
function dataAsRecords(data) {
    return data.map(row =>
        Object.fromEntries(TABLE_HEADER.map((key, i) => [key, row[i]]))
    );
}

function getCompanySummary(summary, companyName) {
    for (let record of summary) {
        if (record.company == companyName) {
            return record
        }
    }
    return null
}

function calculateKP(leaderboard, summary) {
    for (let entry of leaderboard) {
        const company = entry.company;
        const record = getCompanySummary(summary, company);
        if (record) {
            const armyKills = record["kills"];
            entry["kpar"] = (entry["kills"] + entry["assists"]) / armyKills;
        } else {
            entry.kpar = 0.0;
        }
    }
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

function rowColorFormatter(row) {
    const company = row.getData().company;
    const faction = getCompanyFaction(COMPANIES, company);
    if (faction) {
        const style = STYLES[faction]
        row.getElement().style.background = style.background;
        row.getElement().style.color = style.color;
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

async function summarizeGroups(groups) {
    let groups_summary = [];

    for (let i of Object.keys(groups)) {
        const group = groups[i];

        let summary = {
            "name": `Group ${i}`,
            "score": 0,
            "kills": 0,
            "deaths": 0,
            "assists": 0,
            "healing": 0,
            "damage": 0,
            "kpar": 0.0
        };

        for (let entry of group) {
            summary["score"] += entry.score;
            summary["kills"] += entry.kills;
            summary["deaths"] += entry.deaths;
            summary["assists"] += entry.assists;
            summary["healing"] += entry.healing;
            summary["damage"] += entry.damage;
            summary["kpar"] += entry.kpar / group.length;
        }
        groups_summary.push(summary);
    }
    return groups_summary;
}

function summarizeData(companies, leaderboard) {
    let summary = {}
    for (let company of companies) {
        summary[company] = {
            "company": company,
            "players": 0,
            "kills": 0,
            "deaths": 0,
            "assists": 0,
            "healing": 0,
            "damage": 0,
            "dpk": 0.0,
            "apk": 0.0
        };
    }
    for (let row of leaderboard) {
        const company = row[8];
        summary[company]["players"] += 1;
        summary[company]["kills"] += row[3];
        summary[company]["deaths"] += row[4];
        summary[company]["assists"] += row[5];
        summary[company]["healing"] += row[6];
        summary[company]["damage"] += row[7];
    }

    for (let company of companies) {
        summary[company]["dpk"] = summary[company]["damage"] / summary[company]["kills"];
        summary[company]["apk"] = summary[company]["assists"] / summary[company]["kills"];
    }

    return Object.values(summary);
}

async function createGroupTables(leaderboard, groups) {
    let tables = {}

    // Create tables by grouping leaderboard entries
    for (let row of leaderboard) {
        const player = row.name;
        for (let entry of groups) {
            if (entry[0].toLowerCase() == player.toLowerCase()) {
                const group_nb = entry[2];
                if (!(group_nb in tables)) {
                    tables[group_nb] = []
                }
                tables[group_nb].push(row);
            }
        }
    }

    // Check for tables with 4 rows and add a dummy last row
    for (let t of Object.keys(tables)) {
        if (tables[t].length == 4) {
            let lastRowCopy = { ...tables[t].slice(-1)[0] };  // Make a copy of the last row

            // Clear the data in the last row copy
            for (let key in lastRowCopy) {
                lastRowCopy[key] = ""; // Set each column's value to an empty string
            }

            tables[t].push(lastRowCopy);  // Add the dummy last row to the table
        }
    }

    return tables;
}


async function setupGrousTable(data) {
    for (let group of Object.keys(data)) {
        const tableName = `#group-${group}`;
        const tableData = data[group];
        new Tabulator(tableName, {
            data: tableData,
            layout: "fitColumns",
            columns: GROUPS_COLUMNS
        });
    }
}

async function setupSummaryTable(data) {
    new Tabulator("#summary-table", {
        data: data,
        layout: "fitColumns",
        columns: SUMMARY_COLUMNS,
        rowFormatter: rowColorFormatter
    });
}

async function setupGroupsSummaryTable(data) {
    new Tabulator("#groups-summary-table", {
        data: data,
        layout: "fitColumns",
        columns: GROUPS_COLUMNS,
    });
}
// Use an async function to await data
async function setupTable(data) {
    leaderboardTable = new Tabulator("#leaderboard-table", {
        data: data,
        layout: "fitColumns",
        columns: LEADERBOARD_COLUMNS,
        rowFormatter: rowColorFormatter
    });
}

const warDropdown = document.getElementById("war-select");
const companyAllButton = document.getElementById("btn-all");
const company1Button = document.getElementById("btn-company1");
const company2Button = document.getElementById("btn-company2");

async function loadWars() {
    let data = await db.query(warSheet, warsQuery);
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

async function getCompaniesAtWar(leaderboard) {
    let companies = []
    for (let row of leaderboard) {
        if (!(companies.includes(row.company))) {
            companies.push(row.company);
        }

        if (companies.length == 2) {
            return companies;
        }
    }
    return companies;
}

async function getStylesForCompanies(companies) {
    let styles = {}
    for (let comp of companies) {
        const faction = getCompanyFaction(COMPANIES, comp);
        if (faction == "Covenant") {
            styles[comp] = ["bg-yellow-600", "hover:bg-yellow-500", "active:bg-yellow-700"];
        } else if (faction == "Marauder") {
            styles[comp] = ["bg-green-600", "hover:bg-green-500", "active:bg-green-700"];
        } else if (faction == "Syndicate") {
            styles[comp] = ["bg-purple-600", "hover:bg-purple-500", "active:bg-purple-700"];
        } else {
            styles[comp] = ["bg-gray-600", "hover:bg-gray-500", "active:bg-gray-700"];
        }
    }
    return styles;
}

async function onCompanyButtonClicked(event) {
    console.log(event)
    if (leaderboardTable) {
        if (event.target.innerText.toLowerCase() == "all") {
            leaderboardTable.clearFilter();
        } else {
            leaderboardTable.setFilter("company", "=", event.target.innerText);
        }
    }
}

async function updateButtons(comapnyNames, styles) {
    const [company1Name, company2Name] = comapnyNames;

    company1Button.textContent = company1Name;
    company2Button.innerText = company2Name;

    const buttons = [company1Button, company2Button, companyAllButton];

    company1Button.classList.remove("bg-gray-600", "hover:bg-gray-500");
    company1Button.classList.remove("bg-gray-600", "hover:bg-gray-500");

    company1Button.classList.add(...styles[company1Name]);
    company2Button.classList.add(...styles[company2Name]);

    buttons.forEach(button => {
        button.disabled = false;
        button.classList.remove("cursor-not-allowed", "opacity-50");
        button.addEventListener("click", onCompanyButtonClicked);
    });
}

function setURLParameter(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value); // add or update the parameter
    history.pushState({}, '', url);   // or use replaceState to not add to history
}

async function parseArgs() {
    const params = new URLSearchParams(window.location.search);
    return {
        warId: params.get('wid')
    };
}

async function onWarDropdownChange(event) {
    const warId = event.target.value;
    setURLParameter("wid", warId);
    const data = await db.query(leadboardSheet, leadboardQuery.replace("{warId}", warId));
    const groups_data = await db.query(groupsSheet, "SELECT A, B, C WHERE B=" + warId);
    const companies = (await db.query(warSheet, "SELECT D, E WHERE A=" + warId))[0]
    const summary = await summarizeData(companies, data);
    const leaderboard = await dataAsRecords(data);
    calculateKP(leaderboard, summary);
    const groups = await createGroupTables(leaderboard, groups_data);
    const groupsSummary = await summarizeGroups(groups);
    const comapniesAtWar = await getCompaniesAtWar(leaderboard);
    setupTable(leaderboard);
    setupSummaryTable(summary);
    setupGroupsSummaryTable(groupsSummary);
    setupGrousTable(groups);
    updateButtons(comapniesAtWar, await getStylesForCompanies(comapniesAtWar));
}

function onWindowPopState() {
    setWar();
}

function setUpListeners() {
    warDropdown.addEventListener("change", onWarDropdownChange)
    window.addEventListener("popstate", onWindowPopState)
}

async function setWar() {
    const args = await parseArgs();
    if (args.warId) {
        warDropdown.value = args.warId;
        warDropdown.dispatchEvent(new Event("change"));
    }
}

setUpListeners();
await loadWars();
setupTable(null);
setupSummaryTable(null)
setupGrousTable(NULL_GROUPS)
setWar()
