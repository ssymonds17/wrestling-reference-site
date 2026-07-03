import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import { getPromotionById } from "./mongodb/services/promotions"

const handler = async (event: any) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Promotion id is required" })
    }

    await connectToDatabase()
    const promotion = await getPromotionById(id)

    if (!promotion) {
      return createApiResponse(404, { message: "Promotion not found" })
    }

    return createApiResponse(200, { data: promotion })
  } catch (error) {
    logger.error(`Error getting promotion: ${error}`)
    return createApiResponse(502, { message: "Could not get promotion" })
  }
}

export { handler }
