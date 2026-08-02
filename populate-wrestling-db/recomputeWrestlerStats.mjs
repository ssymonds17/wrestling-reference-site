/**
 * recomputeWrestlerStats.mjs
 *
 * Rebuilds each Wrestler's totalMatches + ratingCounts from Match data via
 * PUT /wrestler/{id}/recompute. createMatch does not maintain these fields, so
 * this must be run after bulk match ingestion (independent of the year/tier
 * recomputes, which touch WrestlerYear and careerScore instead).
 *
 * Idempotent — safe to re-run.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { client, delay } from "./utils.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"))

async function main() {
  const wrestlerMap = readJson(path.join(__dirname, "wrestler-id-map.json"))
  const ids = [...new Set(Object.values(wrestlerMap))]
  console.log(`recomputing match stats for ${ids.length} wrestlers...`)

  let ok = 0
  const failures = []
  for (const id of ids) {
    try {
      await client.put(`/wrestler/${id}/recompute`)
      ok++
    } catch (err) {
      failures.push({ id, error: err.response?.data ?? err.message })
    }
    await delay(150)
  }

  console.log(`recompute wrestler stats: ok ${ok}, failed ${failures.length}`)
  if (failures.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, "failed_wrestler_stats.json"),
      JSON.stringify(failures, null, 2),
    )
    console.log("see failed_wrestler_stats.json")
  }
}

main().catch((err) => {
  console.error(err.response?.data ?? err)
  process.exit(1)
})
