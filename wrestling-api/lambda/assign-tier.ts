import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import { assignTier, InvalidTierError } from "./mongodb/services/wrestlerYears"

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

    const body = JSON.parse(event.body || "{}")
    const rawTier = body.yearTier
    const tierName =
      rawTier === null || typeof rawTier === "string" ? rawTier : undefined

    if (tierName === undefined) {
      return createApiResponse(400, {
        message: "yearTier is required (string or null)",
      })
    }

    await connectToDatabase()
    const wrestlerYear = await assignTier(wrestlerId, year, tierName)

    if (!wrestlerYear) {
      return createApiResponse(404, {
        message:
          "WrestlerYear not found — recompute the year first before assigning a tier",
      })
    }

    return createApiResponse(200, { data: wrestlerYear })
  } catch (error) {
    if (error instanceof InvalidTierError) {
      return createApiResponse(400, {
        message: `Invalid tier name: "${error.tierName}"`,
      })
    }
    logger.error(`Error assigning tier: ${error}`)
    return createApiResponse(502, {
      message: "Could not assign tier",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
