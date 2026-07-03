export { connectToDatabase } from "./client"

export {
  createWrestler,
  getWrestlers,
  getWrestlerById,
  updateWrestler,
  deleteWrestler,
  recomputeWrestlerStats,
  WrestlerReferencedError,
} from "./services/wrestlers"
export type {
  WrestlerListFilters,
  WrestlerUpdateInput,
  WrestlerRecomputeResult,
} from "./services/wrestlers"

export { default as Wrestler } from "./models/wrestler"
export type {
  WrestlerDocument,
  WrestlerData,
  WrestlerRatingCounts,
  WrestlerAlias,
} from "./models/wrestler"

export { default as Promotion } from "./models/promotion"
export type {
  PromotionDocument,
  PromotionData,
  PromotionAlias,
} from "./models/promotion"

export { default as Match, OVERALL_MATCH_RATING_VALUES } from "./models/match"
export type {
  MatchDocument,
  MatchData,
  MatchParticipant,
  OverallMatchRating,
} from "./models/match"

export { default as WrestlerYear } from "./models/wrestlerYear"
export type {
  WrestlerYearDocument,
  WrestlerYearData,
  WrestlerYearRatingCounts,
} from "./models/wrestlerYear"
