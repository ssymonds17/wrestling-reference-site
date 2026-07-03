import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import { getDistinctYears } from "./mongodb/services/wrestlerYears"

const handler = async (_event: any) => {
  try {
    await connectToDatabase()
    const years = await getDistinctYears()

    return createApiResponse(200, {
      data: years,
      count: years.length,
    })
  } catch (error) {
    logger.error(`Error getting years: ${error}`)
    return createApiResponse(502, { message: "Could not get years" })
  }
}

export { handler }
