import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import { recomputeWrestlerYear } from "./mongodb/services/wrestlerYears"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const wrestlerId = event.pathParameters?.id
    const yearParam = event.pathParameters?.year
    const year = yearParam ? Number.parseInt(yearParam, 10) : NaN

    if (!wrestlerId) {
      return createApiResponse(400, { message: "Wrestler id is required" })
    }
    if (!Number.isFinite(year)) {
      return createApiResponse(400, { message: "year must be a number" })
    }

    await connectToDatabase()
    const wrestlerYear = await recomputeWrestlerYear(wrestlerId, year)

    if (!wrestlerYear) {
      return createApiResponse(200, {
        data: null,
        message:
          "No matches found for this wrestler/year — WrestlerYear removed if it existed",
      })
    }

    return createApiResponse(200, { data: wrestlerYear })
  } catch (error) {
    logger.error(`Error recomputing wrestler year: ${error}`)
    return createApiResponse(502, {
      message: "Could not recompute wrestler year",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
