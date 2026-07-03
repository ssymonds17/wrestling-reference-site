import mongoose from "mongoose"

export interface WrestlerAlias {
  search: string
  display: string
}

export interface WrestlerRatingCounts {
  rating1: number
  rating2: number
  rating3: number
  rating4: number
  rating5: number
}

export interface WrestlerDocument extends mongoose.Document {
  name: string
  displayName: string
  aliases: WrestlerAlias[]
  cagematchUrl?: string
  totalMatches: number
  ratingCounts: WrestlerRatingCounts
  careerScore: number
}

export type WrestlerData = {
  name: string
  displayName: string
  aliases?: WrestlerAlias[]
  cagematchUrl?: string
  totalMatches?: number
  ratingCounts?: Partial<WrestlerRatingCounts>
  careerScore?: number
}

const aliasSubSchema = new mongoose.Schema(
  {
    search: { type: String, required: true },
    display: { type: String, required: true },
  },
  { _id: false }
)

const wrestlerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  aliases: { type: [aliasSubSchema], default: [] },
  cagematchUrl: { type: String },
  totalMatches: { type: Number, default: 0 },
  ratingCounts: {
    rating1: { type: Number, default: 0 },
    rating2: { type: Number, default: 0 },
    rating3: { type: Number, default: 0 },
    rating4: { type: Number, default: 0 },
    rating5: { type: Number, default: 0 },
  },
  careerScore: { type: Number, default: 0 },
})

wrestlerSchema.index({ name: 1 })
wrestlerSchema.index({ "aliases.search": 1 })
wrestlerSchema.index({ careerScore: -1 })

export default mongoose.model<WrestlerDocument>(
  "Wrestler",
  wrestlerSchema,
  "wrestlers"
)
