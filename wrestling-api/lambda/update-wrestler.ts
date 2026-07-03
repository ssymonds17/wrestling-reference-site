import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import {
  updateWrestler,
  WrestlerUpdateInput,
} from "./mongodb/services/wrestlers"

const buildPatch = (body: any): WrestlerUpdateInput => {
  const patch: WrestlerUpdateInput = {}

  if (typeof body.displayName === "string" && body.displayName.trim().length > 0) {
    patch.displayName = body.displayName
  }

  if (Array.isArray(body.aliases)) {
    patch.aliases = body.aliases.filter(
      (a: unknown): a is string => typeof a === "string"
    )
  }

  if (body.cagematchUrl === null || typeof body.cagematchUrl === "string") {
    patch.cagematchUrl = body.cagematchUrl
  }

  return patch
}

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return createApiResponse(400, { message: "Wrestler id is required" })
    }

    const body = JSON.parse(event.body || "{}")
    const patch = buildPatch(body)

    if (Object.keys(patch).length === 0) {
      return createApiResponse(400, {
        message: "No valid fields to update (displayName, aliases, cagematchUrl)",
      })
    }

    await connectToDatabase()
    const wrestler = await updateWrestler(id, patch)

    if (!wrestler) {
      return createApiResponse(404, { message: "Wrestler not found" })
    }

    return createApiResponse(200, { data: wrestler })
  } catch (error) {
    logger.error(`Error updating wrestler: ${error}`)
    return createApiResponse(502, {
      message: "Could not update wrestler",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
