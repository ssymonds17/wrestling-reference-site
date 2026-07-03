import Wrestler, { WrestlerData } from "../models/wrestler"

export interface WrestlerListFilters {
  sortBy?: "careerScore" | "totalMatches" | "name"
  limit?: number
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
  const data: WrestlerData = {
    name: input.displayName.toLowerCase(),
    displayName: input.displayName,
    aliases: (input.aliases ?? []).map(buildAlias),
    cagematchUrl: input.cagematchUrl,
  }
  return Wrestler.create(data)
}

const SORT_ORDERS: Record<
  NonNullable<WrestlerListFilters["sortBy"]>,
  Record<string, 1 | -1>
> = {
  careerScore: { careerScore: -1 },
  totalMatches: { totalMatches: -1 },
  name: { name: 1 },
}

export const getWrestlers = async (filters?: WrestlerListFilters) => {
  const sortBy = filters?.sortBy ?? "careerScore"
  const limit = filters?.limit ?? 500

  return Wrestler.find({}).sort(SORT_ORDERS[sortBy]).limit(limit).exec()
}
