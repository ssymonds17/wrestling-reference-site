import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import { getWrestlerYears } from "./mongodb/services/wrestlerYears"

const handler = async (event: any) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Wrestler id is required" })
    }

    await connectToDatabase()
    const years = await getWrestlerYears(id)

    return createApiResponse(200, {
      data: years,
      count: years.length,
    })
  } catch (error) {
    logger.error(`Error getting wrestler years: ${error}`)
    return createApiResponse(502, { message: "Could not get wrestler years" })
  }
}

export { handler }
