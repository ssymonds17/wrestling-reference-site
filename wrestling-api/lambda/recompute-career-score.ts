import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import { recomputeCareerScore } from "./mongodb/services/wrestlerYears"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const wrestlerId = event.pathParameters?.id
    if (!wrestlerId) {
      return createApiResponse(400, { message: "Wrestler id is required" })
    }

    await connectToDatabase()
    const careerScore = await recomputeCareerScore(wrestlerId)

    return createApiResponse(200, {
      data: { wrestlerId, careerScore },
    })
  } catch (error) {
    logger.error(`Error recomputing career score: ${error}`)
    return createApiResponse(502, {
      message: "Could not recompute career score",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
