import Wrestler from "../models/wrestler"
import Promotion from "../models/promotion"

export type SearchItemType = "wrestler" | "promotion"

export interface SearchFilters {
  searchString: string
  itemType: SearchItemType
  limit?: number
}

const escapeRegex = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const DEFAULT_LIMIT = 20

// Wrestler aliases are single-name { search, display }.
const wrestlerQuery = (regex: RegExp) => ({
  $or: [{ name: regex }, { displayName: regex }, { "aliases.search": regex }],
})

// Promotion aliases are { abbreviation, fullName } pairs; both forms are
// searchable, and the canonical abbreviation is its own field. So "WWE",
// "WWF", and "World Wrestling Federation" all resolve to the same doc.
const promotionQuery = (regex: RegExp) => ({
  $or: [
    { name: regex },
    { displayName: regex },
    { abbreviation: regex },
    { "aliases.abbreviation": regex },
    { "aliases.fullName": regex },
  ],
})

export const search = async ({
  searchString,
  itemType,
  limit = DEFAULT_LIMIT,
}: SearchFilters) => {
  const regex = new RegExp(escapeRegex(searchString), "i")

  if (itemType === "wrestler") {
    return Wrestler.find(wrestlerQuery(regex))
      .sort({ displayName: 1 })
      .limit(limit)
      .exec()
  }

  return Promotion.find(promotionQuery(regex))
    .sort({ displayName: 1 })
    .limit(limit)
    .exec()
}
