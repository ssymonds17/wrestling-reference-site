import Wrestler, {
  WrestlerData,
  WrestlerRatingCounts,
} from "../models/wrestler"
import Match from "../models/match"

export interface WrestlerListFilters {
  sortBy?: "careerScore" | "totalMatches" | "name"
  limit?: number
}

const SORT_ORDERS: Record<
  NonNullable<WrestlerListFilters["sortBy"]>,
  Record<string, 1 | -1>
> = {
  careerScore: { careerScore: -1, name: 1 },
  totalMatches: { totalMatches: -1, name: 1 },
  name: { name: 1 },
}

const buildAlias = (display: string) => ({
  search: display.toLowerCase(),
  display,
})

export const createWrestler = async (input: {
  displayName: string
  aliases?: string[]
  cagematchUrl?: string
}) => {
  const aliasInputs = input.aliases ?? []
  const data: WrestlerData = {
    name: input.displayName.toLowerCase(),
    displayName: input.displayName,
    aliases: aliasInputs.map(buildAlias),
    cagematchUrl: input.cagematchUrl,
  }
  return Wrestler.create(data)
}

export const getWrestlers = async (filters?: WrestlerListFilters) => {
  const sortBy = filters?.sortBy ?? "careerScore"
  const limit = filters?.limit ?? 500

  return Wrestler.find({}).sort(SORT_ORDERS[sortBy]).limit(limit).exec()
}

export const getWrestlerById = async (id: string) => {
  return Wrestler.findById(id).exec()
}

export interface WrestlerUpdateInput {
  displayName?: string
  aliases?: string[]
  cagematchUrl?: string | null
}

export const updateWrestler = async (
  id: string,
  input: WrestlerUpdateInput
) => {
  const updates: Record<string, unknown> = {}
  const unsets: Record<string, unknown> = {}

  if (input.displayName !== undefined) {
    updates.displayName = input.displayName
    updates.name = input.displayName.toLowerCase()
  }

  if (input.aliases !== undefined) {
    updates.aliases = input.aliases.map(buildAlias)
  }

  if (input.cagematchUrl === null) {
    unsets.cagematchUrl = ""
  } else if (input.cagematchUrl !== undefined) {
    updates.cagematchUrl = input.cagematchUrl
  }

  const updateQuery: Record<string, unknown> = {}
  if (Object.keys(updates).length > 0) updateQuery.$set = updates
  if (Object.keys(unsets).length > 0) updateQuery.$unset = unsets

  if (Object.keys(updateQuery).length === 0) {
    // Nothing to do; return the current doc.
    return Wrestler.findById(id).exec()
  }

  return Wrestler.findByIdAndUpdate(id, updateQuery, { new: true }).exec()
}

export class WrestlerReferencedError extends Error {
  constructor(public readonly wrestlerId: string) {
    super(
      `Wrestler ${wrestlerId} is referenced by at least one match; remove references first.`
    )
    this.name = "WrestlerReferencedError"
  }
}

export const deleteWrestler = async (id: string) => {
  const referenced = await Match.exists({ "participants.wrestlerId": id })
  if (referenced) {
    throw new WrestlerReferencedError(id)
  }
  return Wrestler.findByIdAndDelete(id).exec()
}

export interface WrestlerRecomputeResult {
  totalMatches: number
  ratingCounts: WrestlerRatingCounts
}

const EMPTY_RATING_COUNTS = (): WrestlerRatingCounts => ({
  rating1: 0,
  rating2: 0,
  rating3: 0,
  rating4: 0,
  rating5: 0,
})

export const recomputeWrestlerStats = async (
  id: string
): Promise<WrestlerRecomputeResult | null> => {
  const wrestler = await Wrestler.findById(id).exec()
  if (!wrestler) return null

  const totalMatches = await Match.countDocuments({
    "participants.wrestlerId": wrestler._id,
  })

  const ratingAggregation = await Match.aggregate([
    { $match: { "participants.wrestlerId": wrestler._id } },
    { $project: { participants: 1 } },
    { $unwind: "$participants" },
    { $match: { "participants.wrestlerId": wrestler._id } },
    {
      $group: {
        _id: "$participants.performanceRating",
        count: { $sum: 1 },
      },
    },
  ]).exec()

  const ratingCounts = EMPTY_RATING_COUNTS()
  for (const row of ratingAggregation) {
    const key = `rating${row._id}` as keyof WrestlerRatingCounts
    if (key in ratingCounts) {
      ratingCounts[key] = row.count
    }
  }

  wrestler.totalMatches = totalMatches
  wrestler.ratingCounts = ratingCounts
  await wrestler.save()

  return { totalMatches, ratingCounts }
}
