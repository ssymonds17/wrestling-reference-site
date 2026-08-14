interface TierBadgeProps {
  tier: string | null | undefined
}

/**
 * Keyed on tier name so an unrecognised value (e.g. after a constant rename)
 * still renders, just in the neutral fallback style.
 *
 *   Notable           blue
 *   Flashes of Great  green
 *   Great Worker      gold
 *   World Class       purple
 *
 * Shares the colour language of the rating badges, so blue reads as the floor
 * and purple as the ceiling across the whole site. Gold runs hotter than the
 * other bands (25% fill, 70% border, near-white text) for the same reason it
 * does in MatchRatingBadge: at matching opacity it washes out to a dull
 * yellow.
 */
export const TIER_CLASSES: Record<string, string> = {
  'World Class': 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  'Great Worker': 'bg-yellow-400/25 text-yellow-100 border-yellow-400/70',
  'Flashes of Great': 'bg-green-500/15 text-green-300 border-green-500/40',
  Notable: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
}

export const TIER_FALLBACK_CLASSES =
  'bg-gray-700/30 text-gray-300 border-gray-600'

/** The classes for a tier, falling back to neutral for an unknown name. */
export const tierClasses = (tier: string): string =>
  TIER_CLASSES[tier] ?? TIER_FALLBACK_CLASSES

export default function TierBadge({ tier }: TierBadgeProps) {
  if (!tier) {
    return <span className="text-gray-600 text-xs">no tier</span>
  }

  return (
    <span
      className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium ${tierClasses(
        tier,
      )}`}
    >
      {tier}
    </span>
  )
}
