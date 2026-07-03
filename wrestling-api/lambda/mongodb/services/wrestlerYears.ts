import mongoose from "mongoose"
import Wrestler from "../models/wrestler"
import WrestlerYear, {
  WrestlerYearRatingCounts,
} from "../models/wrestlerYear"
import Match from "../models/match"
import { computeYearScore } from "../../utils/year-score"
import { TIER_POINTS, isValidTierName } from "../../utils/tiers"

export type YearStandingsSortBy = "formulaScore" | "yearTierPoints"

const YEAR_STANDINGS_SORT_ORDERS: Record<
  YearStandingsSortBy,
  Record<string, 1 | -1>
> = {
  formulaScore: { formulaScore: -1, yearTierPoints: -1 },
  yearTierPoints: { yearTierPoints: -1, formulaScore: -1 },
}

export class InvalidTierError extends Error {
  constructor(public readonly tierName: string) {
    super(`"${tierName}" is not a valid tier name`)
    this.name = "InvalidTierError"
  }
}

const toObjectId = (
  id: string | mongoose.Types.ObjectId
): mongoose.Types.ObjectId =>
  typeof id === "string" ? new mongoose.Types.ObjectId(id) : id

const EMPTY_RATING_COUNTS = (): WrestlerYearRatingCounts => ({
  rating1: 0,
  rating2: 0,
  rating3: 0,
  rating4: 0,
  rating5: 0,
})

const tierPointsFor = (tier: string | undefined): number => {
  if (!tier) return 0
  return TIER_POINTS[tier] ?? 0
}

export const getWrestlerYears = async (wrestlerId: string) => {
  return WrestlerYear.find({ wrestlerId: toObjectId(wrestlerId) })
    .sort({ year: -1 })
    .exec()
}

export const getYearStandings = async (
  year: number,
  sortBy: YearStandingsSortBy = "formulaScore"
) => {
  return WrestlerYear.find({ year })
    .sort(YEAR_STANDINGS_SORT_ORDERS[sortBy])
    .exec()
}

export const getDistinctYears = async () => {
  const result = await Match.aggregate([
    { $group: { _id: "$year", matchCount: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $project: { _id: 0, year: "$_id", matchCount: 1 } },
  ]).exec()
  return result as Array<{ year: number; matchCount: number }>
}

/**
 * Sums the wrestler's yearTierPoints across all their WrestlerYear docs and
 * writes it back to Wrestler.careerScore. Returns the new score.
 */
export const recomputeCareerScore = async (
  wrestlerId: string
): Promise<number> => {
  const wid = toObjectId(wrestlerId)
  const result = await WrestlerYear.aggregate([
    { $match: { wrestlerId: wid } },
    { $group: { _id: null, total: { $sum: "$yearTierPoints" } } },
  ]).exec()

  const careerScore = result[0]?.total ?? 0

  await Wrestler.findByIdAndUpdate(wid, { $set: { careerScore } }).exec()

  return careerScore
}

/**
 * Rebuilds a wrestler's WrestlerYear doc for a given year from Match data.
 * Preserves any manually assigned yearTier; refreshes yearTierPoints against
 * the current TIER_POINTS constant. Deletes the doc if no matches remain.
 */
export const recomputeWrestlerYear = async (
  wrestlerId: string,
  year: number
) => {
  const wid = toObjectId(wrestlerId)
  const wrestler = await Wrestler.findById(wid).exec()
  if (!wrestler) return null

  const matches = await Match.find({
    "participants.wrestlerId": wid,
    year,
  }).exec()

  const ratings: number[] = []
  const ratingCounts = EMPTY_RATING_COUNTS()
  let matchCount = 0

  for (const match of matches) {
    matchCount += 1
    const participant = match.participants.find((p) =>
      p.wrestlerId.equals(wid)
    )
    const rating = participant?.performanceRating
    if (rating !== null && rating !== undefined) {
      ratings.push(rating)
      const key = `rating${rating}` as keyof WrestlerYearRatingCounts
      if (key in ratingCounts) {
        ratingCounts[key] += 1
      }
    }
  }

  if (matchCount === 0) {
    await WrestlerYear.deleteOne({ wrestlerId: wid, year })
    return null
  }

  const { weightedAverage, aboveOneFactor, formulaScore, aboveOneCount } =
    computeYearScore(ratings, matchCount)

  const existing = await WrestlerYear.findOne({
    wrestlerId: wid,
    year,
  }).exec()

  const preservedTier = existing?.yearTier
  const refreshedTierPoints = tierPointsFor(preservedTier)

  const updated = await WrestlerYear.findOneAndUpdate(
    { wrestlerId: wid, year },
    {
      $set: {
        wrestlerId: wid,
        displayName: wrestler.displayName,
        year,
        matchCount,
        ratingCounts,
        aboveOneCount,
        weightedAverage,
        aboveOneFactor,
        formulaScore,
        yearTierPoints: refreshedTierPoints,
        yearTier: preservedTier,
      },
    },
    { upsert: true, new: true }
  ).exec()

  return updated
}

/**
 * Assigns (or clears) a wrestler's tier for a given year. Requires the
 * WrestlerYear doc to already exist — you must recompute it from Match data
 * before you can tier it. Recomputes the wrestler's careerScore afterwards.
 */
export const assignTier = async (
  wrestlerId: string,
  year: number,
  tierName: string | null
) => {
  if (tierName !== null && !isValidTierName(tierName)) {
    throw new InvalidTierError(tierName)
  }

  const wid = toObjectId(wrestlerId)
  const wrestlerYear = await WrestlerYear.findOne({
    wrestlerId: wid,
    year,
  }).exec()

  if (!wrestlerYear) return null

  if (tierName === null) {
    wrestlerYear.set("yearTier", undefined)
    wrestlerYear.yearTierPoints = 0
  } else {
    wrestlerYear.yearTier = tierName
    wrestlerYear.yearTierPoints = TIER_POINTS[tierName]
  }

  await wrestlerYear.save()
  await recomputeCareerScore(wrestlerId)

  return wrestlerYear
}
