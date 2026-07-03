import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import {
  deletePromotion,
  PromotionReferencedError,
} from "./mongodb/services/promotions"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Promotion id is required" })
    }

    await connectToDatabase()
    const promotion = await deletePromotion(id)

    if (!promotion) {
      return createApiResponse(404, { message: "Promotion not found" })
    }

    return createApiResponse(200, {
      data: { id: promotion._id, displayName: promotion.displayName },
      message: "Promotion deleted",
    })
  } catch (error) {
    if (error instanceof PromotionReferencedError) {
      return createApiResponse(409, {
        message: "Cannot delete promotion while referenced by matches",
        promotionId: error.promotionId,
      })
    }

    logger.error(`Error deleting promotion: ${error}`)
    return createApiResponse(502, {
      message: "Could not delete promotion",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
