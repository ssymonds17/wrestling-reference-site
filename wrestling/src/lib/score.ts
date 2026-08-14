import { WrestlerYear } from './api'

type ScoreParts = Pick<
  WrestlerYear,
  'weightedAverage' | 'aboveOneCount' | 'matchCount'
>

/**
 * The year score's two inputs, phrased for humans, for use as a tooltip on the
 * score value.
 *
 * "Weighted" is doing real work in the first label: `weightedAverage` (K) is
 * the mean of the per-rating weights (-2, 0, 1, 2.5, 4), so it runs from -2 to
 * 4 rather than 1 to 5, and it is not the average of the scores in the Score
 * column.
 *
 * The second line is the share of performances rated above 1, i.e. everything
 * that is not Negative — Neutral counts as non-negative. It is derived from
 * `aboveOneCount` rather than from `aboveOneFactor` (L), because L is the
 * square root of this share and not the share itself, so printing L as a
 * percentage would misreport it.
 */
export const scoreBreakdown = (year: ScoreParts): string => {
  const nonNegativeShare =
    year.matchCount > 0
      ? Math.round((year.aboveOneCount / year.matchCount) * 100)
      : 0

  return [
    `Average performance (weighted): ${year.weightedAverage.toFixed(2)}`,
    `Non-negative percentage: ${nonNegativeShare}%`,
  ].join('\n')
}
