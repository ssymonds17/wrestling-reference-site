/**
 * recomputeCareerScores.mjs
 *
 * Final sweep: calls PUT /wrestler/{id}/career/recompute for every wrestler to
 * rebuild Wrestler.careerScore from the sum of their WrestlerYear.yearTierPoints.
 * Mostly a safety net — assignTiersFromCsv already recomputes career score on
 * each tier assignment — but this also zeroes out wrestlers who received no
 * tier and guards against any missed recompute.
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
  console.log(`recomputing career scores for ${ids.length} wrestlers...`)

  let ok = 0
  const failures = []
  for (const id of ids) {
    try {
      await client.put(`/wrestler/${id}/career/recompute`)
      ok++
    } catch (err) {
      failures.push({ id, error: err.response?.data ?? err.message })
    }
    await delay(150)
  }

  console.log(`recompute careers: ok ${ok}, failed ${failures.length}`)
  if (failures.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, "failed_careers.json"),
      JSON.stringify(failures, null, 2),
    )
    console.log("see failed_careers.json")
  }
}

main().catch((err) => {
  console.error(err.response?.data ?? err)
  process.exit(1)
})
