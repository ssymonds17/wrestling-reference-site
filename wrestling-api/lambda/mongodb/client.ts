import mongoose from "mongoose"
import { logger } from "../utils"

const MONGODB_URI = process.env.MONGODB_URI

let isConnected: boolean = false

export const connectToDatabase = async (): Promise<typeof mongoose> => {
  if (isConnected) {
    return mongoose
  }

  if (!MONGODB_URI) {
    throw new Error("MongoDB connection string is missing.")
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      dbName: "wrestling",
    })

    isConnected = true
    logger.info("MongoDB connected")
    return db
  } catch (error) {
    logger.error("MongoDB connection error:", { error })
    throw error
  }
}
