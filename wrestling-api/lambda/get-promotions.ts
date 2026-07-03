import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import {
  getPromotions,
  PromotionListFilters,
} from "./mongodb/services/promotions"

const VALID_SORT_BY = new Set<PromotionListFilters["sortBy"]>([
  "displayName",
  "name",
])

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const params = event.queryStringParameters ?? {}
    const sortBy = VALID_SORT_BY.has(params.sortBy) ? params.sortBy : undefined
    const limit = params.limit ? Number.parseInt(params.limit, 10) : undefined

    const promotions = await getPromotions({ sortBy, limit })

    return createApiResponse(200, {
      data: promotions,
      count: promotions.length,
    })
  } catch (error) {
    logger.error(`Error getting promotions: ${error}`)
    return createApiResponse(502, {
      message: "Could not get promotions",
    })
  }
}

export { handler }
