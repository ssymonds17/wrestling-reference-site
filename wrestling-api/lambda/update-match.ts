import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase, OVERALL_MATCH_RATING_VALUES } from "./mongodb"
import {
  updateMatch,
  UpdateMatchInput,
  InvalidOverallMatchRatingError,
  CreateMatchParticipantInput,
} from "./mongodb/services/matches"
import {
  recomputeWrestlerYear,
  recomputeCareerScore,
} from "./mongodb/services/wrestlerYears"

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0

type DateResult = { date?: Date; error?: string }

const parseDatePatch = (raw: unknown): DateResult => {
  if (raw === undefined) return {}
  if (typeof raw !== "string") return { error: "date must be an ISO string" }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return { error: "date must be a valid ISO date string" }
  }
  return { date: parsed }
}

type ParticipantsResult =
  | { error: string }
  | { participants: CreateMatchParticipantInput[] }

const buildParticipantsPatch = (raw: unknown[]): ParticipantsResult => {
  for (let i = 0; i < raw.length; i++) {
    const p = raw[i]
    if (!p || typeof p !== "object") {
      return { error: `participants[${i}] must be an object` }
    }
    const pp = p as Record<string, unknown>
    if (!isNonEmptyString(pp.wrestlerId)) {
      return { error: `participants[${i}].wrestlerId is required` }
    }
    if (!isNonEmptyString(pp.displayName)) {
      return { error: `participants[${i}].displayName is required` }
    }
  }
  return {
    participants: raw.map((p: any) => ({
      wrestlerId: p.wrestlerId,
      displayName: p.displayName,
      performanceRating: p.performanceRating,
    })),
  }
}

const buildPatch = (body: any): UpdateMatchInput | { error: string } => {
  const patch: UpdateMatchInput = {}

  const dateResult = parseDatePatch(body.date)
  if (dateResult.error) return { error: dateResult.error }
  if (dateResult.date) patch.date = dateResult.date

  if (isNonEmptyString(body.promotionId)) patch.promotionId = body.promotionId
  if (isNonEmptyString(body.promotionDisplayName)) {
    patch.promotionDisplayName = body.promotionDisplayName
  }
  if (isNonEmptyString(body.show)) patch.show = body.show
  if (body.cardUrl === null || isNonEmptyString(body.cardUrl)) {
    patch.cardUrl = body.cardUrl
  }
  if (isNonEmptyString(body.participantsDisplay)) {
    patch.participantsDisplay = body.participantsDisplay
  }
  if (isNonEmptyString(body.matchTitle)) patch.matchTitle = body.matchTitle
  if (body.extraInfo === null || isNonEmptyString(body.extraInfo)) {
    patch.extraInfo = body.extraInfo
  }
  if (typeof body.overallMatchRating === "number") {
    patch.overallMatchRating = body.overallMatchRating
  }

  if (Array.isArray(body.participants)) {
    const result = buildParticipantsPatch(body.participants)
    if ("error" in result) return { error: result.error }
    patch.participants = result.participants
  }

  return patch
}

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Match id is required" })
    }

    const body = JSON.parse(event.body || "{}")
    const patch = buildPatch(body)

    if ("error" in patch) {
      return createApiResponse(400, { message: patch.error })
    }
    if (Object.keys(patch).length === 0) {
      return createApiResponse(400, { message: "No valid fields to update" })
    }

    await connectToDatabase()
    const result = await updateMatch(id, patch)

    if (!result) {
      return createApiResponse(404, { message: "Match not found" })
    }

    // Recompute affected WrestlerYear docs, then careerScore for each unique wrestler.
    const affectedWrestlers = new Set<string>()
    for (const { wrestlerId, year } of result.affectedWrestlerYears) {
      await recomputeWrestlerYear(wrestlerId, year)
      affectedWrestlers.add(wrestlerId)
    }
    for (const wid of affectedWrestlers) {
      await recomputeCareerScore(wid)
    }

    return createApiResponse(200, {
      data: result.match,
      recomputedWrestlerYears: result.affectedWrestlerYears,
    })
  } catch (error) {
    if (error instanceof InvalidOverallMatchRatingError) {
      return createApiResponse(400, {
        message: "Invalid overallMatchRating",
        allowedValues: OVERALL_MATCH_RATING_VALUES,
        received: error.value,
      })
    }
    logger.error(`Error updating match: ${error}`)
    return createApiResponse(502, {
      message: "Could not update match",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
