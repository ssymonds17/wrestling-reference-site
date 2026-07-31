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

const buildAliasedQuery = (regex: RegExp, includeAbbreviation: boolean) => {
  const or: Record<string, RegExp>[] = [
    { name: regex },
    { "aliases.search": regex },
    { displayName: regex },
  ]
  if (includeAbbreviation) {
    or.push({ abbreviation: regex })
  }
  return { $or: or }
}

export const search = async ({
  searchString,
  itemType,
  limit = DEFAULT_LIMIT,
}: SearchFilters) => {
  const regex = new RegExp(escapeRegex(searchString), "i")

  if (itemType === "wrestler") {
    return Wrestler.find(buildAliasedQuery(regex, false))
      .sort({ displayName: 1 })
      .limit(limit)
      .exec()
  }

  return Promotion.find(buildAliasedQuery(regex, true))
    .sort({ displayName: 1 })
    .limit(limit)
    .exec()
}
