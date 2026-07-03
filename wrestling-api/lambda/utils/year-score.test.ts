import { computeYearScore } from "./year-score"

describe("computeYearScore", () => {
  it("returns zeros when matchCount is 0", () => {
    expect(computeYearScore([], 0)).toEqual({
      weightedAverage: 0,
      aboveOneFactor: 0,
      formulaScore: 0,
      aboveOneCount: 0,
    })
  })

  it("returns zeros when ratings is empty and matchCount is 0", () => {
    const result = computeYearScore([], 0)
    expect(result.formulaScore).toBe(0)
  })

  it("all-1s collapses to a score of 0 (negative K, zero L)", () => {
    const result = computeYearScore([1, 1, 1, 1], 4)
    expect(result.weightedAverage).toBe(-2)
    expect(result.aboveOneFactor).toBe(0)
    expect(result.aboveOneCount).toBe(0)
    expect(result.formulaScore).toBe(0)
  })

  it("all-5s yields max weighted average and L=1", () => {
    const result = computeYearScore([5, 5, 5, 5], 4)
    expect(result.weightedAverage).toBe(4)
    expect(result.aboveOneFactor).toBe(1)
    expect(result.aboveOneCount).toBe(4)
    // 4 * 1 * ln(5) ≈ 6.4378
    expect(result.formulaScore).toBeCloseTo(4 * Math.log(5), 6)
  })

  it("single rated match: rating 3, matchCount 1", () => {
    const result = computeYearScore([3], 1)
    expect(result.weightedAverage).toBe(1)
    expect(result.aboveOneFactor).toBe(1)
    expect(result.aboveOneCount).toBe(1)
    // 1 * 1 * ln(2)
    expect(result.formulaScore).toBeCloseTo(Math.log(2), 6)
  })

  it("mixed ratings [1, 3, 5] with matchCount 3", () => {
    const result = computeYearScore([1, 3, 5], 3)
    // weights: -2 + 1 + 4 = 3
    // K = 3 / 3 = 1
    expect(result.weightedAverage).toBeCloseTo(1, 6)
    // aboveOneCount = 2 (the 3 and 5), L = sqrt(2/3)
    expect(result.aboveOneCount).toBe(2)
    expect(result.aboveOneFactor).toBeCloseTo(Math.sqrt(2 / 3), 6)
    // formulaScore = 1 * sqrt(2/3) * ln(4)
    expect(result.formulaScore).toBeCloseTo(
      Math.sqrt(2 / 3) * Math.log(4),
      6
    )
  })

  it("dilutes L when matchCount exceeds ratings length (unrated matches)", () => {
    // 2 rated matches (both 5s) out of 4 total matches
    const result = computeYearScore([5, 5], 4)
    // K uses matchCount as divisor: (4 + 4) / 4 = 2
    expect(result.weightedAverage).toBe(2)
    // aboveOneCount = 2, L = sqrt(2/4) = sqrt(0.5)
    expect(result.aboveOneCount).toBe(2)
    expect(result.aboveOneFactor).toBeCloseTo(Math.sqrt(0.5), 6)
    // formulaScore = 2 * sqrt(0.5) * ln(5)
    expect(result.formulaScore).toBeCloseTo(2 * Math.sqrt(0.5) * Math.log(5), 6)
  })
})
