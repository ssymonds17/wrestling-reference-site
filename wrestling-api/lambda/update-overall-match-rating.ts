import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase, OVERALL_MATCH_RATING_VALUES } from "./mongodb"
import {
  updateOverallMatchRating,
  InvalidOverallMatchRatingError,
} from "./mongodb/services/matches"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Match id is required" })
    }

    const body = JSON.parse(event.body || "{}")
    if (typeof body.overallMatchRating !== "number") {
      return createApiResponse(400, {
        message: "overallMatchRating is required (number)",
      })
    }

    await connectToDatabase()
    const match = await updateOverallMatchRating(id, body.overallMatchRating)

    if (!match) {
      return createApiResponse(404, { message: "Match not found" })
    }

    return createApiResponse(200, { data: match })
  } catch (error) {
    if (error instanceof InvalidOverallMatchRatingError) {
      return createApiResponse(400, {
        message: "Invalid overallMatchRating",
        allowedValues: OVERALL_MATCH_RATING_VALUES,
        received: error.value,
      })
    }
    logger.error(`Error updating overall match rating: ${error}`)
    return createApiResponse(502, {
      message: "Could not update overall match rating",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
