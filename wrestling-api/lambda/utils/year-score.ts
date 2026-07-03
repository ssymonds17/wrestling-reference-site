const RATING_WEIGHTS: Record<number, number> = {
  1: -2,
  2: 0,
  3: 1,
  4: 2.5,
  5: 4,
}

export interface YearScoreResult {
  weightedAverage: number
  aboveOneFactor: number
  formulaScore: number
  aboveOneCount: number
}

/**
 * Port of the spreadsheet formula for a wrestler's yearly score:
 *   K = sum(weight(r)) / matchCount              — weighted average
 *   L = sqrt(count(r != 1) / matchCount)         — above-1 factor
 *   formulaScore = K * L * ln(1 + matchCount)
 *
 * Weights per rating: 1 = -2, 2 = 0, 3 = 1, 4 = 2.5, 5 = 4.
 *
 * `ratings` is the list of non-null performance ratings (1-5). `matchCount`
 * is the total number of matches the wrestler was in that year — in current
 * practice equal to `ratings.length` since every match is rated, but the
 * formula treats them independently so unrated matches would still dilute L.
 */
export const computeYearScore = (
  ratings: number[],
  matchCount: number
): YearScoreResult => {
  if (matchCount === 0) {
    return {
      weightedAverage: 0,
      aboveOneFactor: 0,
      formulaScore: 0,
      aboveOneCount: 0,
    }
  }

  const totalWeight = ratings.reduce(
    (sum, r) => sum + (RATING_WEIGHTS[r] ?? 0),
    0
  )
  const weightedAverage = totalWeight / matchCount

  const aboveOneCount = ratings.filter((r) => r !== 1).length
  const aboveOneFactor = Math.sqrt(aboveOneCount / matchCount)

  const formulaScore =
    aboveOneFactor === 0
      ? 0
      : weightedAverage * aboveOneFactor * Math.log(1 + matchCount)

  return {
    weightedAverage,
    aboveOneFactor,
    formulaScore,
    aboveOneCount,
  }
}
