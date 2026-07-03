import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import { deleteMatch } from "./mongodb/services/matches"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Match id is required" })
    }

    await connectToDatabase()
    const match = await deleteMatch(id)

    if (!match) {
      return createApiResponse(404, { message: "Match not found" })
    }

    return createApiResponse(200, {
      data: { id: match._id, date: match.date, show: match.show },
      message: "Match deleted",
    })
  } catch (error) {
    logger.error(`Error deleting match: ${error}`)
    return createApiResponse(502, {
      message: "Could not delete match",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
