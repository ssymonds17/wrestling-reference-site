import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import { getCareerLeaderboard } from "./mongodb/services/leaderboard"

const DEFAULT_LIMIT = 100

const handler = async (event: any) => {
  try {
    const params = event.queryStringParameters ?? {}
    const rawLimit = params.limit
      ? Number.parseInt(params.limit, 10)
      : DEFAULT_LIMIT

    if (!Number.isFinite(rawLimit) || rawLimit < 1) {
      return createApiResponse(400, {
        message: "limit must be a positive number",
      })
    }

    await connectToDatabase()
    const leaderboard = await getCareerLeaderboard(rawLimit)

    return createApiResponse(200, {
      data: leaderboard,
      count: leaderboard.length,
      limit: rawLimit,
    })
  } catch (error) {
    logger.error(`Error getting career leaderboard: ${error}`)
    return createApiResponse(502, {
      message: "Could not get career leaderboard",
    })
  }
}

export { handler }
