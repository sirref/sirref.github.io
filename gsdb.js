const BASE_URL = `https://docs.google.com/spreadsheets/d/{sheetId}/gviz/tq?tqx=out:json&sheet={sheetName}&tq={query}`;

const STR_SHEETID = "{sheetId}"
const STR_SHEETNAME = "{sheetName}"
const STR_QUERY = "{query}"

export class GSDB {


    constructor(sheetId) {
        this.sheetId = sheetId
    }

    async query(sheetName, query) {
        const encodedQuery = encodeURIComponent(query)
        const fullUrl = BASE_URL.replace(STR_SHEETID, this.sheetId)
            .replace(STR_SHEETNAME, sheetName)
            .replace(STR_QUERY, encodedQuery)

        const response = await fetch(fullUrl)
        const text = await response.text()
        const json = JSON.parse(text.substring(47).slice(0, -2));
        const rows = json.table.rows.map(row => row.c.map(cell => cell?.v));
        return rows;
    }
}
