export const TIERS = [
  { name: "World Class", points: 15, order: 0 },
  { name: "Great Worker", points: 10, order: 1 },
  { name: "Flashes of Great", points: 5, order: 2 },
  { name: "Notable", points: 1, order: 3 },
] as const

export type TierName = (typeof TIERS)[number]["name"]

export const TIER_POINTS: Record<string, number> = Object.fromEntries(
  TIERS.map((t) => [t.name, t.points])
)
