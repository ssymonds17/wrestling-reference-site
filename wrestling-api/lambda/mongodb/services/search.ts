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

const buildAliasedQuery = (regex: RegExp) => ({
  $or: [
    { name: regex },
    { "aliases.search": regex },
    { displayName: regex },
  ],
})

export const search = async ({
  searchString,
  itemType,
  limit = DEFAULT_LIMIT,
}: SearchFilters) => {
  const regex = new RegExp(escapeRegex(searchString), "i")
  const query = buildAliasedQuery(regex)

  if (itemType === "wrestler") {
    return Wrestler.find(query).sort({ displayName: 1 }).limit(limit).exec()
  }

  return Promotion.find(query).sort({ displayName: 1 }).limit(limit).exec()
}
