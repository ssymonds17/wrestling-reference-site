import Wrestler from "../models/wrestler"

const DEFAULT_LIMIT = 100
const HEADROOM = 20

const extractYearPointsDesc = (wrestler: any): number[] => {
  if (!Array.isArray(wrestler.years)) return []
  return wrestler.years
    .map((y: any) => y?.yearTierPoints ?? 0)
    .sort((a: number, b: number) => b - a)
}

const compareByCareerAndYears = (a: any, b: any): number => {
  if (b.careerScore !== a.careerScore) return b.careerScore - a.careerScore

  const aPoints = extractYearPointsDesc(a)
  const bPoints = extractYearPointsDesc(b)
  const len = Math.max(aPoints.length, bPoints.length)

  for (let i = 0; i < len; i++) {
    const av = aPoints[i] ?? 0
    const bv = bPoints[i] ?? 0
    if (bv !== av) return bv - av
  }

  return String(a.name).localeCompare(String(b.name))
}

/**
 * Fetches the top wrestlers by careerScore desc with populated year data,
 * then re-sorts in-process using a tie-breaker comparator: when two
 * wrestlers share careerScore, compare the sorted-desc arrays of their
 * years[].yearTierPoints values element-by-element (so 1x15 trumps 2x10;
 * 15+10 trumps 15+5; etc.). Falls back to name asc for full determinism.
 *
 * Fetches with headroom (limit + 20) to give the tie-breaker room to promote
 * an edge case; anyone outside limit+20 wouldn't win against the top N on
 * tie-breaker for the data volumes we expect.
 */
export const getCareerLeaderboard = async (
  limit: number = DEFAULT_LIMIT
) => {
  const wrestlers = await Wrestler.find()
    .sort({ careerScore: -1, name: 1 })
    .limit(limit + HEADROOM)
    .populate({
      path: "years",
      select: "year yearTierPoints yearTier formulaScore matchCount",
    })
    .exec()

  const sorted = [...wrestlers].sort(compareByCareerAndYears)
  return sorted.slice(0, limit)
}
