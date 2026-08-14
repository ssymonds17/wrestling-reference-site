import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import {
  getWrestlers,
  getWrestlersByIds,
  MAX_WRESTLER_IDS,
  WrestlerListFilters,
} from "./mongodb/services/wrestlers"

const VALID_SORT_BY = new Set<WrestlerListFilters["sortBy"]>([
  "careerScore",
  "totalMatches",
  "name",
])

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const params = event.queryStringParameters ?? {}

    // Batch-by-id is its own mode: sortBy and limit do not apply, since the
    // caller already knows exactly which wrestlers it wants.
    if (params.ids) {
      const ids = String(params.ids)
        .split(",")
        .map((id: string) => id.trim())
        .filter(Boolean)

      if (ids.length > MAX_WRESTLER_IDS) {
        return createApiResponse(400, {
          message: `ids accepts at most ${MAX_WRESTLER_IDS} values, got ${ids.length}`,
        })
      }

      const wrestlers = await getWrestlersByIds(ids)

      return createApiResponse(200, {
        data: wrestlers,
        count: wrestlers.length,
        requested: ids.length,
      })
    }

    const sortBy = VALID_SORT_BY.has(params.sortBy) ? params.sortBy : undefined
    const limit = params.limit ? Number.parseInt(params.limit, 10) : undefined

    const wrestlers = await getWrestlers({ sortBy, limit })

    return createApiResponse(200, {
      data: wrestlers,
      count: wrestlers.length,
    })
  } catch (error) {
    logger.error(`Error getting wrestlers: ${error}`)
    return createApiResponse(502, {
      message: "Could not get wrestlers",
    })
  }
}

export { handler }
