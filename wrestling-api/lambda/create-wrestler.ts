import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import { createWrestler } from "./mongodb/services/wrestlers"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const body = JSON.parse(event.body || "{}")

    if (!body.displayName || typeof body.displayName !== "string") {
      return createApiResponse(400, {
        message: "displayName is required and must be a string",
      })
    }

    await connectToDatabase()

    const wrestler = await createWrestler({
      displayName: body.displayName,
      aliases: Array.isArray(body.aliases) ? body.aliases : undefined,
      cagematchUrl:
        typeof body.cagematchUrl === "string" ? body.cagematchUrl : undefined,
    })

    return createApiResponse(201, {
      id: wrestler._id,
      displayName: wrestler.displayName,
      aliases: wrestler.aliases,
      message: "Successfully created wrestler",
    })
  } catch (error) {
    logger.error(`Error creating wrestler: ${error}`)
    return createApiResponse(502, {
      message: "Could not create wrestler",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
