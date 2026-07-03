import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import {
  updatePromotion,
  PromotionUpdateInput,
} from "./mongodb/services/promotions"

const buildPatch = (body: any): PromotionUpdateInput => {
  const patch: PromotionUpdateInput = {}

  if (typeof body.displayName === "string" && body.displayName.trim().length > 0) {
    patch.displayName = body.displayName
  }

  if (Array.isArray(body.aliases)) {
    patch.aliases = body.aliases.filter(
      (a: unknown): a is string => typeof a === "string"
    )
  }

  if (body.notes === null || typeof body.notes === "string") {
    patch.notes = body.notes
  }

  return patch
}

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Promotion id is required" })
    }

    const body = JSON.parse(event.body || "{}")
    const patch = buildPatch(body)

    if (Object.keys(patch).length === 0) {
      return createApiResponse(400, {
        message: "No valid fields to update (displayName, aliases, notes)",
      })
    }

    await connectToDatabase()
    const promotion = await updatePromotion(id, patch)

    if (!promotion) {
      return createApiResponse(404, { message: "Promotion not found" })
    }

    return createApiResponse(200, { data: promotion })
  } catch (error) {
    logger.error(`Error updating promotion: ${error}`)
    return createApiResponse(502, {
      message: "Could not update promotion",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
