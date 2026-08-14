import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import {
  getMatches,
  MatchListFilters,
  MatchSortBy,
  MatchSortDir,
} from "./mongodb/services/matches"

const VALID_SORT_BY = new Set<MatchSortBy>(["date", "rating"])
const VALID_SORT_DIR = new Set<MatchSortDir>(["asc", "desc"])

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const params = event.queryStringParameters ?? {}

    const filters: MatchListFilters = {}
    if (params.year) filters.year = Number.parseInt(params.year, 10)
    if (params.promotionId) filters.promotionId = params.promotionId
    if (params.wrestlerId) filters.wrestlerId = params.wrestlerId
    if (params.minOverallRating) {
      filters.minOverallRating = Number.parseFloat(params.minOverallRating)
    }
    if (params.limit) filters.limit = Number.parseInt(params.limit, 10)
    if (params.offset) filters.offset = Number.parseInt(params.offset, 10)

    // Unrecognised sort values fall back to the default rather than 400ing, so
    // a stale bookmarked URL still returns results.
    if (params.sortBy && VALID_SORT_BY.has(params.sortBy)) {
      filters.sortBy = params.sortBy
    }
    if (params.sortDir && VALID_SORT_DIR.has(params.sortDir)) {
      filters.sortDir = params.sortDir
    }

    const { data, total } = await getMatches(filters)

    return createApiResponse(200, {
      data,
      count: data.length,
      total,
      limit: filters.limit ?? 100,
      offset: filters.offset ?? 0,
      sortBy: filters.sortBy ?? "date",
      sortDir: filters.sortDir ?? "desc",
    })
  } catch (error) {
    logger.error(`Error getting matches: ${error}`)
    return createApiResponse(502, { message: "Could not get matches" })
  }
}

export { handler }
