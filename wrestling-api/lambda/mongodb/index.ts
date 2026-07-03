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

export {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  PromotionReferencedError,
} from "./services/promotions"
export type {
  PromotionListFilters,
  PromotionUpdateInput,
} from "./services/promotions"

export { search } from "./services/search"
export type { SearchItemType, SearchFilters } from "./services/search"

export {
  createMatch,
  getMatches,
  getMatchById,
  deleteMatch,
  updateMatch,
  updateParticipantRating,
  updateOverallMatchRating,
  InvalidOverallMatchRatingError,
  ParticipantNotFoundError,
} from "./services/matches"
export type {
  MatchListFilters,
  CreateMatchInput,
  CreateMatchParticipantInput,
  UpdateMatchInput,
  UpdateMatchResult,
  UpdateParticipantRatingResult,
  AffectedWrestlerYear,
} from "./services/matches"

export {
  getWrestlerYears,
  getYearStandings,
  getDistinctYears,
  recomputeWrestlerYear,
  recomputeCareerScore,
  assignTier,
  InvalidTierError,
} from "./services/wrestlerYears"
export type { YearStandingsSortBy } from "./services/wrestlerYears"

export { getCareerLeaderboard } from "./services/leaderboard"

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
