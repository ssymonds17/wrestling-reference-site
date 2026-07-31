import Promotion, { PromotionData, PromotionAlias } from "../models/promotion"
import Match from "../models/match"

export interface PromotionListFilters {
  sortBy?: "displayName" | "name"
  limit?: number
}

const SORT_ORDERS: Record<
  NonNullable<PromotionListFilters["sortBy"]>,
  Record<string, 1 | -1>
> = {
  displayName: { displayName: 1 },
  name: { name: 1 },
}

const buildAlias = (alias: PromotionAlias): PromotionAlias => ({
  abbreviation: alias.abbreviation.trim(),
  fullName: alias.fullName.trim(),
})

export const createPromotion = async (input: {
  displayName: string
  abbreviation?: string
  aliases?: PromotionAlias[]
  notes?: string
  cagematchUrl?: string
}) => {
  const aliasInputs = input.aliases ?? []
  const data: PromotionData = {
    name: input.displayName.toLowerCase(),
    displayName: input.displayName,
    abbreviation: input.abbreviation,
    aliases: aliasInputs.map(buildAlias),
    notes: input.notes,
    cagematchUrl: input.cagematchUrl,
  }
  return Promotion.create(data)
}

export const getPromotions = async (filters?: PromotionListFilters) => {
  const sortBy = filters?.sortBy ?? "displayName"
  const limit = filters?.limit ?? 500

  return Promotion.find({}).sort(SORT_ORDERS[sortBy]).limit(limit).exec()
}

export const getPromotionById = async (id: string) => {
  return Promotion.findById(id).exec()
}

export interface PromotionUpdateInput {
  displayName?: string
  abbreviation?: string | null
  aliases?: PromotionAlias[]
  notes?: string | null
  cagematchUrl?: string | null
}

export const updatePromotion = async (
  id: string,
  input: PromotionUpdateInput
) => {
  const updates: Record<string, unknown> = {}
  const unsets: Record<string, unknown> = {}

  if (input.displayName !== undefined) {
    updates.displayName = input.displayName
    updates.name = input.displayName.toLowerCase()
  }

  if (input.abbreviation === null) {
    unsets.abbreviation = ""
  } else if (input.abbreviation !== undefined) {
    updates.abbreviation = input.abbreviation
  }

  if (input.aliases !== undefined) {
    updates.aliases = input.aliases.map(buildAlias)
  }

  if (input.notes === null) {
    unsets.notes = ""
  } else if (input.notes !== undefined) {
    updates.notes = input.notes
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
    return Promotion.findById(id).exec()
  }

  return Promotion.findByIdAndUpdate(id, updateQuery, { new: true }).exec()
}

export class PromotionReferencedError extends Error {
  constructor(public readonly promotionId: string) {
    super(
      `Promotion ${promotionId} is referenced by at least one match; remove references first.`
    )
    this.name = "PromotionReferencedError"
  }
}

export const deletePromotion = async (id: string) => {
  const referenced = await Match.exists({ promotionId: id })
  if (referenced) {
    throw new PromotionReferencedError(id)
  }
  return Promotion.findByIdAndDelete(id).exec()
}
