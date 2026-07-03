import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import { getWrestlerById } from "./mongodb/services/wrestlers"

const handler = async (event: any) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Wrestler id is required" })
    }

    await connectToDatabase()
    const wrestler = await getWrestlerById(id)

    if (!wrestler) {
      return createApiResponse(404, { message: "Wrestler not found" })
    }

    return createApiResponse(200, { data: wrestler })
  } catch (error) {
    logger.error(`Error getting wrestler: ${error}`)
    return createApiResponse(502, { message: "Could not get wrestler" })
  }
}

export { handler }
