import mongoose from "mongoose"

export interface PromotionAlias {
  search: string
  display: string
}

export interface PromotionDocument extends mongoose.Document {
  name: string
  displayName: string
  abbreviation?: string
  aliases: PromotionAlias[]
  notes?: string
  cagematchUrl?: string
}

export type PromotionData = {
  name: string
  displayName: string
  abbreviation?: string
  aliases?: PromotionAlias[]
  notes?: string
  cagematchUrl?: string
}

const aliasSubSchema = new mongoose.Schema(
  {
    search: { type: String, required: true },
    display: { type: String, required: true },
  },
  { _id: false }
)

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  abbreviation: { type: String },
  aliases: { type: [aliasSubSchema], default: [] },
  notes: { type: String },
  cagematchUrl: { type: String },
})

promotionSchema.index({ name: 1 })
promotionSchema.index({ abbreviation: 1 })
promotionSchema.index({ "aliases.search": 1 })

export default mongoose.model<PromotionDocument>(
  "Promotion",
  promotionSchema,
  "promotions"
)
