/**
 * populatePromotions.mjs
 *
 * Creates Promotion docs from promotions-list.csv and writes
 * promotion-id-map.json (lowercased canonical name / abbreviation / every alias
 * abbreviation + full name -> _id) so populateMatches can resolve a match row's
 * era-specific promotion label to the right Promotion.
 *
 * Idempotent: promotions already present (matched by lowercased displayName,
 * which the API stores as `name`) are reused, not re-created.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { client, delay, readCSV } from "./utils.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_DIR = path.join(__dirname, "csvs")

const splitList = (s) =>
  (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)

// Zip the two parallel alias columns into { abbreviation, fullName } pairs.
// The columns are guaranteed 1:1 (validated in the consolidate stage).
const buildAliases = (row) => {
  const abbrs = splitList(row["Alias Abbreviations"])
  const fulls = splitList(row["Alias Full Names"])
  return abbrs.map((abbreviation, i) => ({ abbreviation, fullName: fulls[i] ?? "" }))
}

async function main() {
  const rows = await readCSV(path.join(CSV_DIR, "promotions-list.csv"))

  // Existing promotions -> idempotency by lowercased displayName (== `name`).
  const { data: listResp } = await client.get("/promotions?limit=5000")
  const existingByName = new Map(
    (listResp.data ?? []).map((p) => [p.name, p._id]),
  )

  const records = []
  let created = 0
  let reused = 0

  for (const row of rows) {
    const displayName = (row["Full Name"] || "").trim()
    if (!displayName) continue
    const abbreviation = (row["Abbreviation"] || "").trim()
    const cagematchUrl = (row["Cagematch"] || "").trim() || undefined
    const aliases = buildAliases(row)

    let id = existingByName.get(displayName.toLowerCase())
    if (id) {
      reused++
    } else {
      const { data } = await client.post("/promotion", {
        displayName,
        abbreviation,
        aliases,
        cagematchUrl,
      })
      id = data.id
      created++
      await delay(250)
    }
    records.push({ displayName, abbreviation, aliases, id })
  }

  // Build the id-map in two passes so a canonical abbreviation beats an alias
  // abbreviation on collision (e.g. "WWA" -> World Wrestling Association, not
  // NWA Hollywood which carries WWA as an alias). See PLAN.md.
  const idMap = {}
  const setKey = (key, id, force) => {
    const k = (key || "").toLowerCase().trim()
    if (k && (force || !(k in idMap))) idMap[k] = id
  }
  for (const r of records) {
    setKey(r.displayName, r.id, true)
    setKey(r.abbreviation, r.id, true)
  }
  for (const r of records) {
    for (const a of r.aliases) {
      setKey(a.abbreviation, r.id, false)
      setKey(a.fullName, r.id, false)
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "promotion-id-map.json"),
    JSON.stringify(idMap, null, 2),
  )
  console.log(`promotions: created ${created}, reused ${reused}`)
  console.log(`promotion-id-map.json: ${Object.keys(idMap).length} keys`)
}

main().catch((err) => {
  console.error(err.response?.data ?? err)
  process.exit(1)
})
