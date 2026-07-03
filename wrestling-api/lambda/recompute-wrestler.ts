import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import { recomputeWrestlerStats } from "./mongodb/services/wrestlers"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Wrestler id is required" })
    }

    await connectToDatabase()
    const result = await recomputeWrestlerStats(id)

    if (!result) {
      return createApiResponse(404, { message: "Wrestler not found" })
    }

    return createApiResponse(200, { data: result })
  } catch (error) {
    logger.error(`Error recomputing wrestler stats: ${error}`)
    return createApiResponse(502, {
      message: "Could not recompute wrestler stats",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
