/**
 * consolidate-matches.mjs
 *
 * Pure offline CSV pre-processing (no API calls). Joins performance-list.csv
 * onto match-list.csv on (Date, Promotion, normalised narrative) to attach a
 * per-wrestler performance grade to each participant, resolves each
 * participant's per-match display name from the wrestlers-list names/aliases,
 * and writes:
 *   - match-list.consolidated.json  (input to populateMatches.mjs)
 *   - consolidate-report.json       (anomalies to review before ingestion)
 *
 * Design notes:
 *  - The base participant list is match-list's own `Participants` column (it
 *    exists for every match and follows narrative order). Grades are attached
 *    from the perf join; a participant with no perf row gets rating null.
 *  - The join key normalises the narrative (lowercase, collapse whitespace,
 *    unify vs / vs. / v.s -> vs) so trivial punctuation drift still joins.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import csv from "csv-parser"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_DIR = path.join(__dirname, "csvs")

const OVERALL_RATING_VALUES = new Set([1, 2, 3, 4, 4.25, 4.5, 4.75, 5])

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (d) => rows.push(d))
      .on("end", () => resolve(rows))
      .on("error", reject)
  })
}

const normNarrative = (s) =>
  (s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\bv\.?s\.?\b/g, "vs")
    .replace(/\s+/g, " ")
    .trim()

const joinKey = (date, promo, narrative) =>
  `${(date || "").trim()}|${(promo || "").trim()}|${normNarrative(narrative)}`

const splitCommaList = (s) =>
  (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)

// Aliases may be comma-separated, and a single cell can pack two names with a
// slash (e.g. "Satoru Sayama/Sammy Lee"), so split on both.
const splitAliases = (s) =>
  (s || "")
    .split(/[,/]/)
    .map((x) => x.trim())
    .filter(Boolean)

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const stripAccents = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "")

// Match a name as a whole token, accent-insensitive, with boundaries that
// tolerate trailing punctuation (e.g. "Jr.") which \b would reject.
const nameAppearsIn = (name, text) => {
  if (!name) return false
  const n = escapeRegex(stripAccents(name))
  return new RegExp(`(?<![a-z0-9])${n}(?![a-z0-9])`, "i").test(stripAccents(text))
}

// Pick the per-match display name: the wrestler's canonical name or any alias
// that appears in the narrative (longest first, so the most specific wins).
// Silent success when an alias matches; only a total miss is reported.
function resolveDisplayName(wrestler, narrative) {
  const candidates = [wrestler.displayName, ...wrestler.aliases]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  for (const name of candidates) {
    if (nameAppearsIn(name, narrative)) return { displayName: name, matched: true }
  }
  return { displayName: wrestler.displayName, matched: false }
}

async function main() {
  const [matches, perf, wrestlers] = await Promise.all([
    readCSV(path.join(CSV_DIR, "match-list.csv")),
    readCSV(path.join(CSV_DIR, "performance-list.csv")),
    readCSV(path.join(CSV_DIR, "wrestlers-list.csv")),
  ])

  // externalId -> { displayName, aliases[] }
  const wrestlerById = new Map()
  for (const w of wrestlers) {
    const id = (w.ID || "").trim()
    if (!id) continue
    wrestlerById.set(id, {
      displayName: (w.Wrestler || "").trim(),
      aliases: splitAliases(w["Other Names"]),
    })
  }

  // joinKey -> Map(externalId -> grade|null)
  const perfByKey = new Map()
  for (const p of perf) {
    const key = joinKey(p.Date, p.Promotion, p.Participants)
    if (!perfByKey.has(key)) perfByKey.set(key, new Map())
    const grade = (p.Grade || "").trim()
    perfByKey.get(key).set((p.Wrestler || "").trim(), grade === "" ? null : Number(grade))
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalMatches: matches.length,
    matchesWithNoPerf: [],
    participantSetDisagreements: [],
    countMismatchVsAmount: [],
    unknownWrestlerIds: [],
    canonicalNameNotInNarrative: [],
    invalidOverallRating: [],
  }

  const consolidated = []

  for (const m of matches) {
    const narrative = m["Match Listing"] || ""
    const where = { date: m.Date, promotion: m.Promotion, listing: narrative }
    const perfGroup = perfByKey.get(joinKey(m.Date, m.Promotion, narrative)) || null
    const participantIds = splitCommaList(m.Participants)

    // count vs Amount
    const amount = Number.parseInt(m.Amount, 10)
    if (!Number.isNaN(amount) && participantIds.length !== amount) {
      report.countMismatchVsAmount.push({ ...where, participants: participantIds.length, amount })
    }

    // overall rating in the allowed enum
    const overallRating = Number.parseFloat(m.Rating)
    if (Number.isNaN(overallRating) || !OVERALL_RATING_VALUES.has(overallRating)) {
      report.invalidOverallRating.push({ ...where, rating: m.Rating })
    }

    if (!perfGroup) {
      report.matchesWithNoPerf.push(where)
    } else {
      const perfIds = new Set(perfGroup.keys())
      const mlIds = new Set(participantIds)
      const disagree =
        participantIds.some((id) => !perfIds.has(id)) ||
        [...perfIds].some((id) => !mlIds.has(id))
      if (disagree) {
        report.participantSetDisagreements.push({
          ...where,
          matchList: [...mlIds].sort(),
          perf: [...perfIds].sort(),
        })
      }
    }

    const participants = participantIds.map((id) => {
      const wrestler = wrestlerById.get(id)
      if (!wrestler) {
        report.unknownWrestlerIds.push({ ...where, wrestlerId: id })
        return { wrestlerId: id, displayName: id, performanceRating: null }
      }
      const { displayName, matched } = resolveDisplayName(wrestler, narrative)
      if (!matched) {
        report.canonicalNameNotInNarrative.push({
          ...where,
          wrestlerId: id,
          canonical: wrestler.displayName,
          aliases: wrestler.aliases,
        })
      }
      const performanceRating =
        perfGroup && perfGroup.has(id) ? perfGroup.get(id) : null
      return { wrestlerId: id, displayName, performanceRating }
    })

    consolidated.push({
      date: m.Date,
      year: m.Year,
      promotion: m.Promotion,
      show: m.Show,
      matchListing: narrative,
      matchType: m["Match Type"],
      notes: m.Notes,
      overallRating: m.Rating,
      participants,
    })
  }

  fs.writeFileSync(
    path.join(__dirname, "match-list.consolidated.json"),
    JSON.stringify(consolidated, null, 2),
  )
  fs.writeFileSync(
    path.join(__dirname, "consolidate-report.json"),
    JSON.stringify(report, null, 2),
  )

  const counts = {
    totalMatches: report.totalMatches,
    matchesWithNoPerf: report.matchesWithNoPerf.length,
    participantSetDisagreements: report.participantSetDisagreements.length,
    countMismatchVsAmount: report.countMismatchVsAmount.length,
    unknownWrestlerIds: report.unknownWrestlerIds.length,
    canonicalNameNotInNarrative: report.canonicalNameNotInNarrative.length,
    invalidOverallRating: report.invalidOverallRating.length,
  }
  console.log("consolidate-matches complete")
  console.table(counts)
  console.log("Wrote match-list.consolidated.json and consolidate-report.json")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
