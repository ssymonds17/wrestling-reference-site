import mongoose from "mongoose"
import Match, {
  MatchData,
  OVERALL_MATCH_RATING_VALUES,
  OverallMatchRating,
} from "../models/match"

const OVERALL_MATCH_RATING_SET = new Set<number>(OVERALL_MATCH_RATING_VALUES)

const toObjectId = (
  id: string | mongoose.Types.ObjectId
): mongoose.Types.ObjectId =>
  typeof id === "string" ? new mongoose.Types.ObjectId(id) : id

export type MatchSortBy = "date" | "rating"
export type MatchSortDir = "asc" | "desc"

export interface MatchListFilters {
  year?: number
  promotionId?: string
  wrestlerId?: string
  minOverallRating?: number
  sortBy?: MatchSortBy
  sortDir?: MatchSortDir
  limit?: number
  offset?: number
}

/**
 * Both sorts fall back to date then _id so paging is stable — without a unique
 * final tie-breaker, documents with equal sort values can shuffle between
 * pages and a row may be seen twice or missed entirely.
 *
 * Sorting by a wrestler's own performanceRating is deliberately absent: it
 * lives inside the participants array, so Mongo would sort by the array's
 * max (desc) or min (asc) element rather than by the wrestler in question.
 * That needs an aggregation — see Follow-ups in PLAN.md.
 */
const MATCH_SORT_ORDERS: Record<
  MatchSortBy,
  Record<MatchSortDir, Record<string, 1 | -1>>
> = {
  date: {
    desc: { date: -1, _id: -1 },
    asc: { date: 1, _id: 1 },
  },
  rating: {
    desc: { overallMatchRating: -1, date: -1, _id: -1 },
    asc: { overallMatchRating: 1, date: -1, _id: -1 },
  },
}

export interface MatchListResult {
  data: Awaited<ReturnType<typeof Match.find>>
  /** Total matching the filter, ignoring limit/offset — powers real paging. */
  total: number
}

export interface CreateMatchParticipantInput {
  wrestlerId: string
  displayName: string
  performanceRating?: number | null
}

export interface CreateMatchInput {
  date: Date
  promotionId: string
  promotionDisplayName: string
  show: string
  cardUrl?: string
  participantsDisplay: string
  matchTitle: string
  extraInfo?: string
  participants: CreateMatchParticipantInput[]
  overallMatchRating: number
}

export class InvalidOverallMatchRatingError extends Error {
  constructor(public readonly value: number) {
    super(
      `overallMatchRating ${value} is not one of ${OVERALL_MATCH_RATING_VALUES.join(", ")}`
    )
    this.name = "InvalidOverallMatchRatingError"
  }
}

const normalisePerformanceRating = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null
  return Number(raw)
}

export const createMatch = async (input: CreateMatchInput) => {
  if (!OVERALL_MATCH_RATING_SET.has(input.overallMatchRating)) {
    throw new InvalidOverallMatchRatingError(input.overallMatchRating)
  }

  const participants = input.participants.map((p) => ({
    wrestlerId: toObjectId(p.wrestlerId),
    displayName: p.displayName,
    performanceRating: normalisePerformanceRating(p.performanceRating),
  }))

  const data: MatchData = {
    date: input.date,
    year: input.date.getUTCFullYear(),
    promotionId: toObjectId(input.promotionId),
    promotionDisplayName: input.promotionDisplayName,
    show: input.show,
    cardUrl: input.cardUrl,
    participantsDisplay: input.participantsDisplay,
    matchTitle: input.matchTitle,
    extraInfo: input.extraInfo,
    participantCount: participants.length,
    participants,
    overallMatchRating: input.overallMatchRating as OverallMatchRating,
  }

  return Match.create(data)
}

export const getMatches = async (filters?: MatchListFilters) => {
  const query: Record<string, unknown> = {}

  if (filters?.year !== undefined) {
    query.year = filters.year
  }
  if (filters?.promotionId) {
    query.promotionId = toObjectId(filters.promotionId)
  }
  if (filters?.wrestlerId) {
    query["participants.wrestlerId"] = toObjectId(filters.wrestlerId)
  }
  if (filters?.minOverallRating !== undefined) {
    query.overallMatchRating = { $gte: filters.minOverallRating }
  }

  const limit = filters?.limit ?? 100
  const offset = filters?.offset ?? 0
  const sortBy = filters?.sortBy ?? "date"
  const sortDir = filters?.sortDir ?? "desc"

  // Counted against the same query so the total reflects the filters but not
  // the page window.
  const [data, total] = await Promise.all([
    Match.find(query)
      .sort(MATCH_SORT_ORDERS[sortBy][sortDir])
      .skip(offset)
      .limit(limit)
      .exec(),
    Match.countDocuments(query).exec(),
  ])

  return { data, total }
}

export const getMatchById = async (id: string) => {
  return Match.findById(id).exec()
}

export const deleteMatch = async (id: string) => {
  return Match.findByIdAndDelete(id).exec()
}

export class ParticipantNotFoundError extends Error {
  constructor(
    public readonly matchId: string,
    public readonly wrestlerId: string
  ) {
    super(`Wrestler ${wrestlerId} is not a participant of match ${matchId}`)
    this.name = "ParticipantNotFoundError"
  }
}

export interface UpdateMatchInput {
  date?: Date
  promotionId?: string
  promotionDisplayName?: string
  show?: string
  cardUrl?: string | null
  participantsDisplay?: string
  matchTitle?: string
  extraInfo?: string | null
  participants?: CreateMatchParticipantInput[]
  overallMatchRating?: number
}

export interface AffectedWrestlerYear {
  wrestlerId: string
  year: number
}

export interface UpdateMatchResult {
  match: mongoose.HydratedDocument<any>
  affectedWrestlerYears: AffectedWrestlerYear[]
}

const collectWrestlerIds = (
  participants: Array<{ wrestlerId: mongoose.Types.ObjectId }>
): string[] => participants.map((p) => p.wrestlerId.toString())

/**
 * Applies scalar and/or participants-array edits to a match. Returns the
 * updated match plus the (wrestlerId, year) pairs the caller must recompute:
 * the union of pre- and post-edit participants across the union of pre- and
 * post-edit years (so a date-shifted match rebuilds both years correctly).
 */
export const updateMatch = async (
  id: string,
  input: UpdateMatchInput
): Promise<UpdateMatchResult | null> => {
  const existing = await Match.findById(id).exec()
  if (!existing) return null

  const oldYear = existing.year
  const oldWrestlerIds = collectWrestlerIds(existing.participants)

  const updates: Record<string, unknown> = {}
  const unsets: Record<string, unknown> = {}
  let newYear = oldYear
  let newWrestlerIds = oldWrestlerIds
  let participantsChanged = false

  if (input.date !== undefined) {
    updates.date = input.date
    newYear = input.date.getUTCFullYear()
    updates.year = newYear
  }
  if (input.promotionId !== undefined) {
    updates.promotionId = toObjectId(input.promotionId)
  }
  if (input.promotionDisplayName !== undefined) {
    updates.promotionDisplayName = input.promotionDisplayName
  }
  if (input.show !== undefined) updates.show = input.show
  if (input.cardUrl === null) unsets.cardUrl = ""
  else if (input.cardUrl !== undefined) updates.cardUrl = input.cardUrl
  if (input.participantsDisplay !== undefined) {
    updates.participantsDisplay = input.participantsDisplay
  }
  if (input.matchTitle !== undefined) updates.matchTitle = input.matchTitle
  if (input.extraInfo === null) unsets.extraInfo = ""
  else if (input.extraInfo !== undefined) updates.extraInfo = input.extraInfo
  if (input.overallMatchRating !== undefined) {
    if (!OVERALL_MATCH_RATING_SET.has(input.overallMatchRating)) {
      throw new InvalidOverallMatchRatingError(input.overallMatchRating)
    }
    updates.overallMatchRating = input.overallMatchRating
  }

  if (input.participants !== undefined) {
    const rebuiltParticipants = input.participants.map((p) => ({
      wrestlerId: toObjectId(p.wrestlerId),
      displayName: p.displayName,
      performanceRating: normalisePerformanceRating(p.performanceRating),
    }))
    updates.participants = rebuiltParticipants
    updates.participantCount = rebuiltParticipants.length
    newWrestlerIds = collectWrestlerIds(rebuiltParticipants)
    participantsChanged = true
  }

  const updateQuery: Record<string, unknown> = {}
  if (Object.keys(updates).length > 0) updateQuery.$set = updates
  if (Object.keys(unsets).length > 0) updateQuery.$unset = unsets

  const updated =
    Object.keys(updateQuery).length === 0
      ? existing
      : await Match.findByIdAndUpdate(id, updateQuery, { new: true }).exec()

  if (!updated) return null

  // Compute the (wrestlerId, year) pairs the caller needs to recompute.
  // We only care about rating/participant changes and year shifts — pure
  // scalar edits (show, matchTitle, promotion, etc.) don't affect WrestlerYear.
  const affectedPairs: AffectedWrestlerYear[] = []
  const yearsAffected = new Set<number>()
  if (participantsChanged) yearsAffected.add(newYear)
  if (newYear !== oldYear) {
    yearsAffected.add(oldYear)
    yearsAffected.add(newYear)
  }

  if (yearsAffected.size > 0) {
    const wrestlerIds = new Set([...oldWrestlerIds, ...newWrestlerIds])
    for (const wid of wrestlerIds) {
      for (const y of yearsAffected) {
        affectedPairs.push({ wrestlerId: wid, year: y })
      }
    }
  }

  return { match: updated, affectedWrestlerYears: affectedPairs }
}

export interface UpdateParticipantRatingResult {
  match: mongoose.HydratedDocument<any>
  wrestlerId: string
  year: number
}

export const updateParticipantRating = async (
  matchId: string,
  wrestlerId: string,
  rating: number | null
): Promise<UpdateParticipantRatingResult | null> => {
  const match = await Match.findById(matchId).exec()
  if (!match) return null

  const participant = match.participants.find((p) =>
    p.wrestlerId.equals(wrestlerId)
  )
  if (!participant) {
    throw new ParticipantNotFoundError(matchId, wrestlerId)
  }

  participant.performanceRating = normalisePerformanceRating(rating)
  await match.save()

  return { match, wrestlerId, year: match.year }
}

export const updateOverallMatchRating = async (
  matchId: string,
  rating: number
) => {
  if (!OVERALL_MATCH_RATING_SET.has(rating)) {
    throw new InvalidOverallMatchRatingError(rating)
  }
  return Match.findByIdAndUpdate(
    matchId,
    { $set: { overallMatchRating: rating } },
    { new: true }
  ).exec()
}
