import mongoose from "mongoose"

export interface PromotionAlias {
  abbreviation: string
  fullName: string
}

/**
 * `abbreviation` is required: it is the era label a match is recorded under, so
 * a promotion without one cannot have any match attached to it. The match form
 * builds its label dropdown from the canonical abbreviation plus each alias
 * abbreviation, and an empty dropdown blocks submission entirely.
 */
export interface PromotionDocument extends mongoose.Document {
  name: string
  displayName: string
  abbreviation: string
  aliases: PromotionAlias[]
  notes?: string
  cagematchUrl?: string
}

export type PromotionData = {
  name: string
  displayName: string
  abbreviation: string
  aliases?: PromotionAlias[]
  notes?: string
  cagematchUrl?: string
}

const aliasSubSchema = new mongoose.Schema(
  {
    abbreviation: { type: String, required: true },
    fullName: { type: String, required: true },
  },
  { _id: false }
)

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  abbreviation: { type: String, required: true },
  aliases: { type: [aliasSubSchema], default: [] },
  notes: { type: String },
  cagematchUrl: { type: String },
})

promotionSchema.index({ name: 1 })
promotionSchema.index({ abbreviation: 1 })
promotionSchema.index({ "aliases.abbreviation": 1 })
promotionSchema.index({ "aliases.fullName": 1 })

export default mongoose.model<PromotionDocument>(
  "Promotion",
  promotionSchema,
  "promotions"
)
