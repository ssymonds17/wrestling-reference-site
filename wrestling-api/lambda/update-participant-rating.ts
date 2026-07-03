import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import {
  updateParticipantRating,
  ParticipantNotFoundError,
} from "./mongodb/services/matches"
import {
  recomputeWrestlerYear,
  recomputeCareerScore,
} from "./mongodb/services/wrestlerYears"

const parseRating = (raw: unknown): number | null | undefined => {
  if (raw === null) return null
  if (typeof raw === "number") return raw
  return undefined
}

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const matchId = event.pathParameters?.id
    const wrestlerId = event.pathParameters?.wrestlerId
    if (!matchId || !wrestlerId) {
      return createApiResponse(400, {
        message: "Match id and wrestlerId are required",
      })
    }

    const body = JSON.parse(event.body || "{}")
    const rating = parseRating(body.performanceRating)
    if (rating === undefined) {
      return createApiResponse(400, {
        message: "performanceRating is required (number 1-5 or null)",
      })
    }
    if (rating !== null && (rating < 1 || rating > 5)) {
      return createApiResponse(400, {
        message: "performanceRating must be between 1 and 5 (or null)",
      })
    }

    await connectToDatabase()
    const result = await updateParticipantRating(matchId, wrestlerId, rating)

    if (!result) {
      return createApiResponse(404, { message: "Match not found" })
    }

    await recomputeWrestlerYear(result.wrestlerId, result.year)
    await recomputeCareerScore(result.wrestlerId)

    return createApiResponse(200, {
      data: result.match,
      recomputedWrestlerYear: { wrestlerId: result.wrestlerId, year: result.year },
    })
  } catch (error) {
    if (error instanceof ParticipantNotFoundError) {
      return createApiResponse(404, {
        message: "Wrestler is not a participant of this match",
        matchId: error.matchId,
        wrestlerId: error.wrestlerId,
      })
    }
    logger.error(`Error updating participant rating: ${error}`)
    return createApiResponse(502, {
      message: "Could not update participant rating",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
