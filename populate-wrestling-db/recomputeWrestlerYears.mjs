/**
 * recomputeWrestlerYears.mjs
 *
 * For every (wrestler, year) pair that has match data, calls
 * PUT /wrestler/{id}/year/{year}/recompute to build the WrestlerYear doc
 * (formula stats) from the ingested matches. Must run before assignTiersFromCsv
 * — the tier endpoint requires the WrestlerYear to already exist.
 *
 * The (wrestler, year) pairs are derived locally from the consolidated matches
 * + wrestler-id-map (year taken from the date, matching how the API derives
 * Match.year), which avoids a per-wrestler API round-trip.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { client, delay } from "./utils.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"))

async function main() {
  const matches = readJson(path.join(__dirname, "match-list.consolidated.json"))
  const wrestlerMap = readJson(path.join(__dirname, "wrestler-id-map.json"))

  const yearsByWrestler = new Map()
  for (const m of matches) {
    const year = Number.parseInt((m.date || "").split("/")[2], 10)
    if (!Number.isFinite(year)) continue
    for (const p of m.participants) {
      const wid = wrestlerMap[p.wrestlerId]
      if (!wid) continue
      if (!yearsByWrestler.has(wid)) yearsByWrestler.set(wid, new Set())
      yearsByWrestler.get(wid).add(year)
    }
  }

  const pairs = []
  for (const [wid, years] of yearsByWrestler) {
    for (const year of years) pairs.push({ wid, year })
  }
  console.log(`recomputing ${pairs.length} wrestler-year pairs...`)

  let ok = 0
  const failures = []
  for (const { wid, year } of pairs) {
    try {
      await client.put(`/wrestler/${wid}/year/${year}/recompute`)
      ok++
    } catch (err) {
      failures.push({ wid, year, error: err.response?.data ?? err.message })
    }
    await delay(200)
  }

  console.log(`recompute wrestler-years: ok ${ok}, failed ${failures.length}`)
  if (failures.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, "failed_recompute_years.json"),
      JSON.stringify(failures, null, 2),
    )
    console.log("see failed_recompute_years.json")
  }
}

main().catch((err) => {
  console.error(err.response?.data ?? err)
  process.exit(1)
})
