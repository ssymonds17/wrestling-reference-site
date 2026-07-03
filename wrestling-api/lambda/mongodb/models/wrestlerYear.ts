import mongoose from "mongoose"

export interface WrestlerYearRatingCounts {
  rating1: number
  rating2: number
  rating3: number
  rating4: number
  rating5: number
}

export interface WrestlerYearDocument extends mongoose.Document {
  wrestlerId: mongoose.Types.ObjectId
  displayName: string
  year: number
  matchCount: number
  ratingCounts: WrestlerYearRatingCounts
  aboveOneCount: number
  weightedAverage: number
  aboveOneFactor: number
  formulaScore: number
  yearTier?: string
  yearTierPoints: number
  createdAt: Date
  updatedAt: Date
}

export type WrestlerYearData = {
  wrestlerId: mongoose.Types.ObjectId
  displayName: string
  year: number
  matchCount?: number
  ratingCounts?: Partial<WrestlerYearRatingCounts>
  aboveOneCount?: number
  weightedAverage?: number
  aboveOneFactor?: number
  formulaScore?: number
  yearTier?: string
  yearTierPoints?: number
}

const wrestlerYearSchema = new mongoose.Schema(
  {
    wrestlerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wrestler",
      required: true,
    },
    displayName: { type: String, required: true },
    year: { type: Number, required: true },
    matchCount: { type: Number, default: 0 },
    ratingCounts: {
      rating1: { type: Number, default: 0 },
      rating2: { type: Number, default: 0 },
      rating3: { type: Number, default: 0 },
      rating4: { type: Number, default: 0 },
      rating5: { type: Number, default: 0 },
    },
    aboveOneCount: { type: Number, default: 0 },
    weightedAverage: { type: Number, default: 0 },
    aboveOneFactor: { type: Number, default: 0 },
    formulaScore: { type: Number, default: 0 },
    yearTier: { type: String },
    yearTierPoints: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

wrestlerYearSchema.index({ wrestlerId: 1, year: 1 }, { unique: true })
wrestlerYearSchema.index({ year: 1, formulaScore: -1 })
wrestlerYearSchema.index({ year: 1, yearTierPoints: -1 })

export default mongoose.model<WrestlerYearDocument>(
  "WrestlerYear",
  wrestlerYearSchema,
  "wrestlerYears"
)
