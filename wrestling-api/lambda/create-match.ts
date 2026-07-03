import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase, OVERALL_MATCH_RATING_VALUES } from "./mongodb"
import {
  createMatch,
  InvalidOverallMatchRatingError,
  CreateMatchInput,
} from "./mongodb/services/matches"

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0

interface ParticipantValidationResult {
  ok: boolean
  message?: string
}

const validateParticipant = (
  p: unknown,
  index: number,
): ParticipantValidationResult => {
  if (!p || typeof p !== "object") {
    return { ok: false, message: `participants[${index}] must be an object` }
  }
  const pp = p as Record<string, unknown>
  if (!isNonEmptyString(pp.wrestlerId)) {
    return {
      ok: false,
      message: `participants[${index}].wrestlerId is required`,
    }
  }
  if (!isNonEmptyString(pp.displayName)) {
    return {
      ok: false,
      message: `participants[${index}].displayName is required`,
    }
  }
  return { ok: true }
}

const buildInput = (body: any): CreateMatchInput | { error: string } => {
  if (!isNonEmptyString(body.date)) {
    return { error: "date is required (ISO string)" }
  }
  const date = new Date(body.date)
  if (Number.isNaN(date.getTime())) {
    return { error: "date must be a valid ISO date string" }
  }

  if (!isNonEmptyString(body.promotionId)) {
    return { error: "promotionId is required" }
  }
  if (!isNonEmptyString(body.promotionDisplayName)) {
    return { error: "promotionDisplayName is required" }
  }
  if (!isNonEmptyString(body.show)) {
    return { error: "show is required" }
  }
  if (!isNonEmptyString(body.matchTitle)) {
    return { error: "matchTitle is required" }
  }
  if (!isNonEmptyString(body.participantsDisplay)) {
    return { error: "participantsDisplay is required" }
  }
  if (typeof body.overallMatchRating !== "number") {
    return { error: "overallMatchRating is required (number)" }
  }
  if (!Array.isArray(body.participants) || body.participants.length === 0) {
    return { error: "participants must be a non-empty array" }
  }

  for (let i = 0; i < body.participants.length; i++) {
    const result = validateParticipant(body.participants[i], i)
    if (!result.ok) return { error: result.message ?? "invalid participant" }
  }

  return {
    date,
    promotionId: body.promotionId,
    promotionDisplayName: body.promotionDisplayName,
    show: body.show,
    cardUrl: isNonEmptyString(body.cardUrl) ? body.cardUrl : undefined,
    participantsDisplay: body.participantsDisplay,
    matchTitle: body.matchTitle,
    extraInfo: isNonEmptyString(body.extraInfo) ? body.extraInfo : undefined,
    participants: body.participants.map((p: any) => ({
      wrestlerId: p.wrestlerId,
      displayName: p.displayName,
      performanceRating: p.performanceRating,
    })),
    overallMatchRating: body.overallMatchRating,
  }
}

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const body = JSON.parse(event.body || "{}")
    const input = buildInput(body)

    if ("error" in input) {
      return createApiResponse(400, { message: input.error })
    }

    await connectToDatabase()
    const match = await createMatch(input)

    return createApiResponse(201, {
      id: match._id,
      date: match.date,
      year: match.year,
      show: match.show,
      participantCount: match.participantCount,
      message: "Successfully created match",
    })
  } catch (error) {
    if (error instanceof InvalidOverallMatchRatingError) {
      return createApiResponse(400, {
        message: "Invalid overallMatchRating",
        allowedValues: OVERALL_MATCH_RATING_VALUES,
        received: error.value,
      })
    }
    logger.error(`Error creating match: ${error}`)
    return createApiResponse(502, {
      message: "Could not create match",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
