import { TIER_POINTS } from '@/lib/tiers'

interface TierBadgeProps {
  tier: string | null | undefined
  /** Append the tier's point value, e.g. "Great Worker · 10". */
  withPoints?: boolean
}

// Keyed on tier name so an unrecognised value (e.g. after a constant rename)
// still renders, just in the neutral style.
const TIER_CLASSES: Record<string, string> = {
  'World Class': 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  'Great Worker': 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  'Flashes of Great': 'bg-teal-500/15 text-teal-300 border-teal-500/40',
  Notable: 'bg-gray-500/15 text-gray-300 border-gray-500/40',
}

const FALLBACK_CLASSES = 'bg-gray-700/30 text-gray-300 border-gray-600'

export default function TierBadge({ tier, withPoints = false }: TierBadgeProps) {
  if (!tier) {
    return <span className="text-gray-600 text-xs">no tier</span>
  }

  const points = TIER_POINTS[tier]

  return (
    <span
      className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium ${
        TIER_CLASSES[tier] ?? FALLBACK_CLASSES
      }`}
    >
      {tier}
      {withPoints && points !== undefined && (
        <span className="font-normal opacity-70"> &middot; {points}</span>
      )}
    </span>
  )
}
