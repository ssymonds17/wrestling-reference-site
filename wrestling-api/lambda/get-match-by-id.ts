import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import { getMatchById } from "./mongodb/services/matches"

const handler = async (event: any) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Match id is required" })
    }

    await connectToDatabase()
    const match = await getMatchById(id)

    if (!match) {
      return createApiResponse(404, { message: "Match not found" })
    }

    return createApiResponse(200, { data: match })
  } catch (error) {
    logger.error(`Error getting match: ${error}`)
    return createApiResponse(502, { message: "Could not get match" })
  }
}

export { handler }
