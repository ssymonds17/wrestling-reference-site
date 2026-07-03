import fs from "fs"
import csv from "csv-parser"
import axios from "axios"
import "dotenv/config"

export const API_BASE_URL = process.env.API_BASE_URL

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL environment variable is required (set it in .env)")
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function readCSV(filePath) {
  const results = []
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject)
  })
}

export const splitNames = (nameString) => {
  return nameString
    .split(";")
    .map((name) => name.trim())
    .filter(Boolean)
}

export const client = axios.create({
  baseURL: API_BASE_URL,
})
