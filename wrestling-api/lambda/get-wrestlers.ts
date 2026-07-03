import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import { getWrestlers, WrestlerListFilters } from "./mongodb/services/wrestlers"

const VALID_SORT_BY = new Set<WrestlerListFilters["sortBy"]>([
  "careerScore",
  "totalMatches",
  "name",
])

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const params = event.queryStringParameters ?? {}
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
