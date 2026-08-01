/**
 * populateMatches.mjs
 *
 * Creates Match docs from match-list.consolidated.json, resolving:
 *   - promotion abbreviation -> promotionId via promotion-id-map.json
 *     (promotionDisplayName is kept as the era-correct abbreviation)
 *   - each participant's legacy externalId -> wrestler _id via wrestler-id-map.json
 *
 * A match that can't be fully resolved is skipped entirely (no partial writes)
 * and recorded in failed_matches.json.
 *
 * NOT idempotent (matches have no natural unique key) — run against a clean DB
 * (`npm run teardown` first) so re-runs don't duplicate.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { client, delay } from "./utils.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const OVERALL_RATING_VALUES = new Set([1, 2, 3, 4, 4.25, 4.5, 4.75, 5])

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"))

// "DD/MM/YYYY" -> "YYYY-MM-DD" (the API parses this as UTC midnight).
const toIsoDate = (s) => {
  const [d, m, y] = (s || "").split("/")
  if (!d || !m || !y) return null
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
}

async function main() {
  const matches = readJson(path.join(__dirname, "match-list.consolidated.json"))
  const promotionMap = readJson(path.join(__dirname, "promotion-id-map.json"))
  const wrestlerMap = readJson(path.join(__dirname, "wrestler-id-map.json"))

  const failures = []
  let created = 0

  for (const [index, m] of matches.entries()) {
    const problems = []

    const isoDate = toIsoDate(m.date)
    if (!isoDate) problems.push(`invalid date ${m.date}`)

    const promotionId = promotionMap[(m.promotion || "").toLowerCase().trim()]
    if (!promotionId) problems.push(`unresolved promotion ${m.promotion}`)

    const overallMatchRating = Number.parseFloat(m.overallRating)
    if (!OVERALL_RATING_VALUES.has(overallMatchRating)) {
      problems.push(`invalid overallRating ${m.overallRating}`)
    }

    const participants = m.participants.map((p) => {
      const wrestlerId = wrestlerMap[p.wrestlerId]
      if (!wrestlerId) problems.push(`unresolved wrestler ${p.wrestlerId}`)
      return {
        wrestlerId,
        displayName: p.displayName,
        performanceRating: p.performanceRating,
      }
    })

    if (problems.length > 0) {
      failures.push({ index, date: m.date, promotion: m.promotion, listing: m.matchListing, problems })
      continue
    }

    const payload = {
      date: isoDate,
      promotionId,
      promotionDisplayName: m.promotion,
      show: (m.show || "").trim() || "House Show",
      matchTitle: (m.matchType || "").trim() || "Singles Match",
      participantsDisplay: m.matchListing,
      overallMatchRating,
      participants,
      extraInfo: (m.notes || "").trim() || undefined,
    }

    try {
      await client.post("/match", payload)
      created++
    } catch (err) {
      failures.push({
        index,
        date: m.date,
        promotion: m.promotion,
        listing: m.matchListing,
        error: err.response?.data ?? err.message,
      })
    }
    await delay(250)
  }

  fs.writeFileSync(
    path.join(__dirname, "failed_matches.json"),
    JSON.stringify(failures, null, 2),
  )
  console.log(`matches: created ${created}, failed ${failures.length}`)
  if (failures.length > 0) console.log("See failed_matches.json for details")
}

main().catch((err) => {
  console.error(err.response?.data ?? err)
  process.exit(1)
})
