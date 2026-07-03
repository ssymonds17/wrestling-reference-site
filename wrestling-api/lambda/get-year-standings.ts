import { createApiResponse, logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import {
  getYearStandings,
  YearStandingsSortBy,
} from "./mongodb/services/wrestlerYears"

const VALID_SORT_BY = new Set<YearStandingsSortBy>([
  "formulaScore",
  "yearTierPoints",
])

const handler = async (event: any) => {
  try {
    const yearParam = event.pathParameters?.year
    const year = yearParam ? Number.parseInt(yearParam, 10) : NaN
    if (!Number.isFinite(year)) {
      return createApiResponse(400, { message: "year must be a number" })
    }

    const params = event.queryStringParameters ?? {}
    const sortBy = VALID_SORT_BY.has(params.sortBy) ? params.sortBy : undefined

    await connectToDatabase()
    const standings = await getYearStandings(year, sortBy)

    return createApiResponse(200, {
      data: standings,
      count: standings.length,
      year,
    })
  } catch (error) {
    logger.error(`Error getting year standings: ${error}`)
    return createApiResponse(502, { message: "Could not get year standings" })
  }
}

export { handler }
