import axios from 'axios'
import { createAuthenticatedClient } from './auth-api'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface PromotionAlias {
  abbreviation: string
  fullName: string
}

export interface Promotion {
  _id: string
  name: string
  displayName: string
  abbreviation?: string
  aliases: PromotionAlias[]
  notes?: string
  cagematchUrl?: string
}

export interface CreatePromotionInput {
  displayName: string
  abbreviation?: string
  aliases?: PromotionAlias[]
  notes?: string
  cagematchUrl?: string
}

export interface CreatePromotionResponse {
  id: string
  displayName: string
  abbreviation?: string
  aliases: PromotionAlias[]
  cagematchUrl?: string
  message: string
}

export interface ListResponse<T> {
  data: T[]
  count: number
}

type GetToken = () => Promise<string | null>

// axios omits undefined params already, but building the object explicitly
// keeps the query string free of empty-string values from form/URL state.
const stripUndefined = <T extends object>(
  params: T,
): Record<string, string | number> => {
  const out: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') out[key] = value
  }
  return out
}

// Routes are singular for writes, plural for reads. GET /promotions is public;
// POST /promotion requires a Clerk JWT (requireAuth on the Lambda).

export const getPromotions = async (): Promise<ListResponse<Promotion>> => {
  const { data } = await axios.get<ListResponse<Promotion>>(
    `${API_URL}/promotions`,
  )
  return data
}

export const getPromotionById = async (id: string): Promise<Promotion> => {
  const { data } = await axios.get<{ data: Promotion }>(
    `${API_URL}/promotion/${id}`,
  )
  return data.data
}

export const createPromotion = async (
  input: CreatePromotionInput,
  getToken: GetToken,
): Promise<CreatePromotionResponse> => {
  const client = await createAuthenticatedClient(getToken)
  const { data } = await client.post<CreatePromotionResponse>(
    `${API_URL}/promotion`,
    input,
  )
  return data
}

// --- Wrestlers ---
// Wrestler aliases are single alternative names (not abbreviation pairs).

export interface WrestlerAlias {
  search: string
  display: string
}

export interface RatingCounts {
  rating1: number
  rating2: number
  rating3: number
  rating4: number
  rating5: number
}

export interface Wrestler {
  _id: string
  name: string
  displayName: string
  aliases: WrestlerAlias[]
  cagematchUrl?: string
  totalMatches: number
  ratingCounts: RatingCounts
  careerScore: number
}

export interface CreateWrestlerInput {
  displayName: string
  aliases?: string[]
  cagematchUrl?: string
}

export interface CreateWrestlerResponse {
  id: string
  displayName: string
  aliases: WrestlerAlias[]
  message: string
}

// GET /wrestlers is public; POST /wrestler requires a Clerk JWT.

export type WrestlerSortBy = 'careerScore' | 'totalMatches' | 'name'

export interface GetWrestlersOptions {
  sortBy?: WrestlerSortBy
  limit?: number
}

// The API defaults limit to 500, which is below the current roster size, so
// callers that want the whole list must pass an explicit limit.
export const getWrestlers = async (
  options: GetWrestlersOptions = {},
): Promise<ListResponse<Wrestler>> => {
  const { data } = await axios.get<ListResponse<Wrestler>>(
    `${API_URL}/wrestlers`,
    { params: stripUndefined(options) },
  )
  return data
}

export const getWrestlerById = async (id: string): Promise<Wrestler> => {
  const { data } = await axios.get<{ data: Wrestler }>(
    `${API_URL}/wrestler/${id}`,
  )
  return data.data
}

export const createWrestler = async (
  input: CreateWrestlerInput,
  getToken: GetToken,
): Promise<CreateWrestlerResponse> => {
  const client = await createAuthenticatedClient(getToken)
  const { data } = await client.post<CreateWrestlerResponse>(
    `${API_URL}/wrestler`,
    input,
  )
  return data
}

// --- Matches ---

export const OVERALL_MATCH_RATING_VALUES = [
  1, 2, 3, 4, 4.25, 4.5, 4.75, 5,
] as const

export interface MatchParticipant {
  wrestlerId: string
  displayName: string
  performanceRating: number | null
}

export interface Match {
  _id: string
  date: string
  year: number
  promotionId: string
  promotionDisplayName: string
  show: string
  cardUrl?: string
  participantsDisplay: string
  matchTitle: string
  extraInfo?: string
  participantCount: number
  participants: MatchParticipant[]
  overallMatchRating: number
}

export interface CreateMatchParticipantInput {
  wrestlerId: string
  displayName: string
  performanceRating?: number | null
}

export interface CreateMatchInput {
  date: string
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

export interface CreateMatchResponse {
  id: string
  date: string
  year: number
  show: string
  participantCount: number
  message: string
}

// GET /matches is public; POST /match requires a Clerk JWT.

export interface MatchFilters {
  year?: number
  promotionId?: string
  wrestlerId?: string
  minOverallRating?: number
  limit?: number
  offset?: number
}

export interface PagedResponse<T> extends ListResponse<T> {
  limit: number
  offset: number
}

// Note: the API returns no grand total, only the size of the page it served.
// Pagination is therefore "next page exists if this page came back full".
export const getMatches = async (
  filters: MatchFilters = {},
): Promise<PagedResponse<Match>> => {
  const { data } = await axios.get<PagedResponse<Match>>(
    `${API_URL}/matches`,
    { params: stripUndefined(filters) },
  )
  return data
}

export const getMatchById = async (id: string): Promise<Match> => {
  const { data } = await axios.get<{ data: Match }>(`${API_URL}/match/${id}`)
  return data.data
}

export const createMatch = async (
  input: CreateMatchInput,
  getToken: GetToken,
): Promise<CreateMatchResponse> => {
  const client = await createAuthenticatedClient(getToken)
  const { data } = await client.post<CreateMatchResponse>(
    `${API_URL}/match`,
    input,
  )
  return data
}

// --- Wrestler years, standings and leaderboard ---

export interface WrestlerYear {
  _id: string
  wrestlerId: string
  displayName: string
  year: number
  matchCount: number
  ratingCounts: RatingCounts
  aboveOneCount: number
  weightedAverage: number
  aboveOneFactor: number
  formulaScore: number
  yearTier?: string
  yearTierPoints: number
  updatedAt: string
}

/** The subset of WrestlerYear selected by the leaderboard's years populate. */
export interface LeaderboardYear {
  _id: string
  year: number
  yearTierPoints: number
  yearTier?: string
  formulaScore: number
  matchCount: number
}

export interface LeaderboardEntry extends Wrestler {
  years: LeaderboardYear[]
}

export interface YearSummary {
  year: number
  matchCount: number
}

export type YearStandingsSortBy = 'formulaScore' | 'yearTierPoints'

export const getYears = async (): Promise<ListResponse<YearSummary>> => {
  const { data } = await axios.get<ListResponse<YearSummary>>(
    `${API_URL}/years`,
  )
  return data
}

export const getWrestlerYears = async (
  id: string,
): Promise<ListResponse<WrestlerYear>> => {
  const { data } = await axios.get<ListResponse<WrestlerYear>>(
    `${API_URL}/wrestler/${id}/years`,
  )
  return data
}

export interface YearStandingsResponse extends ListResponse<WrestlerYear> {
  year: number
}

export const getYearStandings = async (
  year: number,
  sortBy: YearStandingsSortBy = 'formulaScore',
): Promise<YearStandingsResponse> => {
  const { data } = await axios.get<YearStandingsResponse>(
    `${API_URL}/year/${year}/standings`,
    { params: { sortBy } },
  )
  return data
}

export const getCareerLeaderboard = async (
  limit = 100,
): Promise<ListResponse<LeaderboardEntry>> => {
  const { data } = await axios.get<ListResponse<LeaderboardEntry>>(
    `${API_URL}/career-leaderboard`,
    { params: { limit } },
  )
  return data
}

/**
 * Assigns or clears a wrestler's tier for a year. Requires a Clerk JWT.
 * The WrestlerYear doc must already exist (it is created by recompute), so
 * this only ever updates an existing row.
 */
export const assignTier = async (
  wrestlerId: string,
  year: number,
  yearTier: string | null,
  getToken: GetToken,
): Promise<{ message: string }> => {
  const client = await createAuthenticatedClient(getToken)
  const { data } = await client.put<{ message: string }>(
    `${API_URL}/wrestler/${wrestlerId}/year/${year}/tier`,
    { yearTier },
  )
  return data
}

// --- Search ---

export type SearchItemType = 'wrestler' | 'promotion'

export interface SearchResponse<T> extends ListResponse<T> {
  itemType: SearchItemType
}

export const searchWrestlers = async (
  searchString: string,
  limit = 20,
): Promise<SearchResponse<Wrestler>> => {
  const { data } = await axios.get<SearchResponse<Wrestler>>(
    `${API_URL}/search`,
    { params: { searchString, itemType: 'wrestler', limit } },
  )
  return data
}

export const searchPromotions = async (
  searchString: string,
  limit = 20,
): Promise<SearchResponse<Promotion>> => {
  const { data } = await axios.get<SearchResponse<Promotion>>(
    `${API_URL}/search`,
    { params: { searchString, itemType: 'promotion', limit } },
  )
  return data
}
