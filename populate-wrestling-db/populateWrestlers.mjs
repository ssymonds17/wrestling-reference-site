/**
 * populateWrestlers.mjs
 *
 * Creates Wrestler docs from wrestlers-list.csv and writes wrestler-id-map.json
 * (legacy externalId -> Mongo _id) so populateMatches can resolve each match's
 * participant ids to real wrestlers.
 *
 * Idempotent: wrestlers already present (matched by lowercased displayName,
 * which the API stores as `name`) are reused, not re-created. Every ID and
 * display name in the source is unique, so the mapping is unambiguous.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { client, delay, readCSV } from "./utils.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_DIR = path.join(__dirname, "csvs")

// Aliases are comma-separated (slash-joined cells were cleaned out upstream,
// but splitting on both stays consistent with the consolidate stage).
const splitAliases = (s) =>
  (s || "")
    .split(/[,/]/)
    .map((x) => x.trim())
    .filter(Boolean)

async function main() {
  const rows = await readCSV(path.join(CSV_DIR, "wrestlers-list.csv"))

  const { data: listResp } = await client.get("/wrestlers?limit=5000")
  const existingByName = new Map(
    (listResp.data ?? []).map((w) => [w.name, w._id]),
  )

  const idMap = {}
  let created = 0
  let reused = 0

  for (const row of rows) {
    const externalId = (row.ID || "").trim()
    const displayName = (row.Wrestler || "").trim()
    if (!externalId || !displayName) continue
    const aliases = splitAliases(row["Other Names"])
    const cagematchUrl = (row.Cagematch || "").trim() || undefined

    let id = existingByName.get(displayName.toLowerCase())
    if (id) {
      reused++
    } else {
      const { data } = await client.post("/wrestler", {
        displayName,
        aliases,
        cagematchUrl,
      })
      id = data.id
      existingByName.set(displayName.toLowerCase(), id)
      created++
      await delay(250)
    }
    idMap[externalId] = id
  }

  fs.writeFileSync(
    path.join(__dirname, "wrestler-id-map.json"),
    JSON.stringify(idMap, null, 2),
  )
  console.log(`wrestlers: created ${created}, reused ${reused}`)
  console.log(`wrestler-id-map.json: ${Object.keys(idMap).length} entries`)
}

main().catch((err) => {
  console.error(err.response?.data ?? err)
  process.exit(1)
})
