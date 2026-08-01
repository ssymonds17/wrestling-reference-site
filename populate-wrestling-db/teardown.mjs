/**
 * teardown.mjs — delete all matches, then wrestlers, then promotions.
 *
 * Order matters: matches reference wrestlers + promotions, and the delete
 * endpoints refuse while a reference still exists, so matches must go first.
 *
 * Use this to clear the FE test records before the real ingestion, or to reset
 * the database for a clean re-ingest. Destructive — it wipes everything.
 */

import { client, delay } from "./utils.mjs"

async function wipe(label, listPath, deletePath) {
  const { data } = await client.get(`${listPath}?limit=5000`)
  const items = data.data ?? []
  console.log(`${label}: ${items.length} to delete`)

  let deleted = 0
  const failures = []
  for (const item of items) {
    try {
      await client.delete(`${deletePath}/${item._id}`)
      deleted++
    } catch (err) {
      failures.push({
        id: item._id,
        error: err.response?.data?.message ?? err.message,
      })
    }
    await delay(150)
  }

  console.log(`${label}: deleted ${deleted}, failed ${failures.length}`)
  for (const f of failures) console.error(`   ${f.id}: ${f.error}`)
}

async function main() {
  await wipe("matches", "/matches", "/match")
  await wipe("wrestlers", "/wrestlers", "/wrestler")
  await wipe("promotions", "/promotions", "/promotion")
  console.log("teardown complete")
}

main().catch((err) => {
  console.error(err.response?.data ?? err)
  process.exit(1)
})
