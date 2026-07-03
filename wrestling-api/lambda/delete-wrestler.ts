import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import {
  deleteWrestler,
  WrestlerReferencedError,
} from "./mongodb/services/wrestlers"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Wrestler id is required" })
    }

    await connectToDatabase()
    const wrestler = await deleteWrestler(id)

    if (!wrestler) {
      return createApiResponse(404, { message: "Wrestler not found" })
    }

    return createApiResponse(200, {
      data: { id: wrestler._id, displayName: wrestler.displayName },
      message: "Wrestler deleted",
    })
  } catch (error) {
    if (error instanceof WrestlerReferencedError) {
      return createApiResponse(409, {
        message: "Cannot delete wrestler while referenced by matches",
        wrestlerId: error.wrestlerId,
      })
    }

    logger.error(`Error deleting wrestler: ${error}`)
    return createApiResponse(502, {
      message: "Could not delete wrestler",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
