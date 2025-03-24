import { GSDB } from "./gsdb.js";

const sheetId = "14byZyCAX_N_AA-y_1tv4CLtgTCaOB-Zq8QbOHmavE6Y";
const sheetName = "leaderboards";
const db = new GSDB(sheetId, sheetName);

const query = "SELECT D, B, E, F, G, H, I, J, K WHERE C=70";
const TABLE_HEADER = ["rank", "name", "score", "kills", "deaths", "assists", "healing", "damage", "team"];

// Convert array of arrays into array of objects
function dataAsRecords(data) {
    return data.map(row =>
        Object.fromEntries(TABLE_HEADER.map((key, i) => [key, row[i]]))
    );
}

// Use an async function to await data
async function setupTable() {
    const data = await db.query(query);
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

setupTable();
