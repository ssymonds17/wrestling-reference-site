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

// Routes are singular for writes, plural for reads. GET /promotions is public;
// POST /promotion requires a Clerk JWT (requireAuth on the Lambda).

export const getPromotions = async (): Promise<ListResponse<Promotion>> => {
  const { data } = await axios.get<ListResponse<Promotion>>(
    `${API_URL}/promotions`,
  )
  return data
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

export interface Wrestler {
  _id: string
  name: string
  displayName: string
  aliases: WrestlerAlias[]
  cagematchUrl?: string
  totalMatches: number
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

export const getWrestlers = async (): Promise<ListResponse<Wrestler>> => {
  const { data } = await axios.get<ListResponse<Wrestler>>(
    `${API_URL}/wrestlers`,
  )
  return data
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

export const getMatches = async (): Promise<ListResponse<Match>> => {
  const { data } = await axios.get<ListResponse<Match>>(`${API_URL}/matches`)
  return data
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
