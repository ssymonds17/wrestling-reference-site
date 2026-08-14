import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase } from "./mongodb"
import { createPromotion } from "./mongodb/services/promotions"

const isAliasPair = (
  a: unknown
): a is { abbreviation: string; fullName: string } =>
  !!a &&
  typeof a === "object" &&
  typeof (a as { abbreviation?: unknown }).abbreviation === "string" &&
  typeof (a as { fullName?: unknown }).fullName === "string"

const parseAliases = (raw: unknown) =>
  Array.isArray(raw) ? raw.filter(isAliasPair) : undefined

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const body = JSON.parse(event.body || "{}")

    if (!body.displayName || typeof body.displayName !== "string") {
      return createApiResponse(400, {
        message: "displayName is required and must be a string",
      })
    }

    // Required because it is the era label matches are recorded under — a
    // promotion without one cannot have matches attached.
    if (
      typeof body.abbreviation !== "string" ||
      body.abbreviation.trim().length === 0
    ) {
      return createApiResponse(400, {
        message:
          "abbreviation is required and must be a non-empty string — it is the label matches are recorded under",
      })
    }

    await connectToDatabase()

    const promotion = await createPromotion({
      displayName: body.displayName,
      abbreviation: body.abbreviation.trim(),
      aliases: parseAliases(body.aliases),
      notes: typeof body.notes === "string" ? body.notes : undefined,
      cagematchUrl:
        typeof body.cagematchUrl === "string" ? body.cagematchUrl : undefined,
    })

    return createApiResponse(201, {
      id: promotion._id,
      displayName: promotion.displayName,
      abbreviation: promotion.abbreviation,
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
