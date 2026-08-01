/**
 * assignTiersFromCsv.mjs
 *
 * Imports the historical per-year tier decisions from wrestlers-list.csv. Each
 * year column holds tier POINTS (15/10/5/1/0); for every non-zero cell this
 * maps the points to the tier NAME and calls PUT /wrestler/{id}/year/{year}/tier.
 *
 * Run AFTER recomputeWrestlerYears — the tier endpoint 404s if the WrestlerYear
 * doesn't exist yet. assignTier also recomputes the wrestler's careerScore.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { client, delay, readCSV } from "./utils.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_DIR = path.join(__dirname, "csvs")
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"))

// Points -> tier name. Must match utils/tiers.ts in the API.
const POINTS_TO_TIER = {
  "15": "World Class",
  "10": "Great Worker",
  "5": "Flashes of Great",
  "1": "Notable",
}

const isYearColumn = (col) => /^\d{4}$/.test(col)

async function main() {
  const rows = await readCSV(path.join(CSV_DIR, "wrestlers-list.csv"))
  const wrestlerMap = readJson(path.join(__dirname, "wrestler-id-map.json"))

  const assignments = []
  const unknownPoints = []
  for (const row of rows) {
    const wid = wrestlerMap[(row.ID || "").trim()]
    if (!wid) continue
    for (const [col, raw] of Object.entries(row)) {
      if (!isYearColumn(col)) continue
      const points = (raw || "").trim()
      if (!points || points === "0") continue
      const tier = POINTS_TO_TIER[points]
      if (!tier) {
        unknownPoints.push({ id: row.ID, year: col, points })
        continue
      }
      assignments.push({ wid, year: Number(col), tier })
    }
  }

  if (unknownPoints.length > 0) {
    console.warn(
      `skipping ${unknownPoints.length} cells with unexpected point values:`,
      unknownPoints.slice(0, 10),
    )
  }
  console.log(`assigning ${assignments.length} tiers...`)

  let ok = 0
  const failures = []
  for (const a of assignments) {
    try {
      await client.put(`/wrestler/${a.wid}/year/${a.year}/tier`, {
        yearTier: a.tier,
      })
      ok++
    } catch (err) {
      failures.push({
        ...a,
        status: err.response?.status,
        error: err.response?.data ?? err.message,
      })
    }
    await delay(200)
  }

  console.log(`assign tiers: ok ${ok}, failed ${failures.length}`)
  if (failures.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, "failed_tiers.json"),
      JSON.stringify(failures, null, 2),
    )
    console.log("see failed_tiers.json")
  }
}

main().catch((err) => {
  console.error(err.response?.data ?? err)
  process.exit(1)
})
