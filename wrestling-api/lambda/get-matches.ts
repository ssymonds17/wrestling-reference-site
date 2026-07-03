import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import { getMatches, MatchListFilters } from "./mongodb/services/matches"

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

    const matches = await getMatches(filters)

    return createApiResponse(200, {
      data: matches,
      count: matches.length,
      limit: filters.limit ?? 100,
      offset: filters.offset ?? 0,
    })
  } catch (error) {
    logger.error(`Error getting matches: ${error}`)
    return createApiResponse(502, { message: "Could not get matches" })
  }
}

export { handler }
