import mongoose from "mongoose"

export const OVERALL_MATCH_RATING_VALUES = [1, 2, 3, 4, 4.25, 4.5, 4.75, 5] as const
export type OverallMatchRating = (typeof OVERALL_MATCH_RATING_VALUES)[number]

export interface MatchParticipant {
  wrestlerId: mongoose.Types.ObjectId
  displayName: string
  performanceRating: number | null
}

export interface MatchDocument extends mongoose.Document {
  date: Date
  year: number
  promotionId: mongoose.Types.ObjectId
  promotionDisplayName: string
  show: string
  cardUrl?: string
  participantsDisplay: string
  matchTitle: string
  extraInfo?: string
  participantCount: number
  participants: MatchParticipant[]
  overallMatchRating: OverallMatchRating
}

export type MatchData = {
  date: Date
  year: number
  promotionId: mongoose.Types.ObjectId
  promotionDisplayName: string
  show: string
  cardUrl?: string
  participantsDisplay: string
  matchTitle: string
  extraInfo?: string
  participantCount: number
  participants: MatchParticipant[]
  overallMatchRating: OverallMatchRating
}

const participantSubSchema = new mongoose.Schema(
  {
    wrestlerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wrestler",
      required: true,
    },
    displayName: { type: String, required: true },
    performanceRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { _id: false }
)

const matchSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  year: { type: Number, required: true },
  promotionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Promotion",
    required: true,
  },
  promotionDisplayName: { type: String, required: true },
  show: { type: String, required: true },
  cardUrl: { type: String },
  participantsDisplay: { type: String, required: true },
  matchTitle: { type: String, required: true },
  extraInfo: { type: String },
  participantCount: { type: Number, required: true },
  participants: { type: [participantSubSchema], required: true },
  overallMatchRating: {
    type: Number,
    required: true,
    enum: OVERALL_MATCH_RATING_VALUES,
  },
})

matchSchema.index({ year: 1 })
matchSchema.index({ date: -1 })
matchSchema.index({ promotionId: 1 })
matchSchema.index({ "participants.wrestlerId": 1 })
matchSchema.index({ overallMatchRating: -1 })

export default mongoose.model<MatchDocument>("Match", matchSchema, "matches")
