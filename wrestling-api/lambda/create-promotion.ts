import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import { createPromotion } from "./mongodb/services/promotions"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const body = JSON.parse(event.body || "{}")

    if (!body.displayName || typeof body.displayName !== "string") {
      return createApiResponse(400, {
        message: "displayName is required and must be a string",
      })
    }

    await connectToDatabase()

    const promotion = await createPromotion({
      displayName: body.displayName,
      aliases: Array.isArray(body.aliases) ? body.aliases : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      cagematchUrl:
        typeof body.cagematchUrl === "string" ? body.cagematchUrl : undefined,
    })

    return createApiResponse(201, {
      id: promotion._id,
      displayName: promotion.displayName,
      aliases: promotion.aliases,
      cagematchUrl: promotion.cagematchUrl,
      message: "Successfully created promotion",
    })
  } catch (error) {
    logger.error(`Error creating promotion: ${error}`)
    return createApiResponse(502, {
      message: "Could not create promotion",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
