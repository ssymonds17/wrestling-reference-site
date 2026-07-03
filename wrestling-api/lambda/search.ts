import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import { search, SearchItemType } from "./mongodb/services/search"

const VALID_ITEM_TYPES = new Set<SearchItemType>([
  "wrestler",
  "promotion",
])

const handler = async (event: any) => {
  try {
    const params = event.queryStringParameters ?? {}
    const searchString: string | undefined = params.searchString?.trim()

    if (!searchString) {
      return createApiResponse(400, {
        message: "searchString is required",
      })
    }

    const itemType = params.itemType as SearchItemType | undefined
    if (!itemType || !VALID_ITEM_TYPES.has(itemType)) {
      return createApiResponse(400, {
        message: "itemType must be one of: wrestler, promotion",
      })
    }

    const limit = params.limit ? Number.parseInt(params.limit, 10) : undefined

    await connectToDatabase()
    const results = await search({ searchString, itemType, limit })

    return createApiResponse(200, {
      data: results,
      count: results.length,
      itemType,
    })
  } catch (error) {
    logger.error(`Error searching: ${error}`)
    return createApiResponse(502, { message: "Could not run search" })
  }
}

export { handler }
