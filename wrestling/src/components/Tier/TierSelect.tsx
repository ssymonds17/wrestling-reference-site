"use client"

import { TIERS } from "@/lib/tiers"
import { tierClasses } from "@/components/TierBadge"

interface TierSelectProps {
  /** Current tier, or null/undefined when untiered. */
  value: string | null | undefined
  onChange: (tier: string | null) => void
  saving?: boolean
  disabled?: boolean
}

const NO_TIER = ""

const NEUTRAL_CLASSES = "border-gray-700 bg-gray-900 text-gray-500"

/**
 * Inline tier picker, sized for bulk work — a year can hold a hundred wrestlers,
 * so this is one interaction per assignment rather than opening a dialog.
 *
 * The select carries the selected tier's own colours so the column still reads
 * as coloured bands while editable, matching TierBadge in the read-only view.
 * Individual options cannot be styled reliably across browsers, so only the
 * closed control is coloured.
 */
export default function TierSelect({
  value,
  onChange,
  saving = false,
  disabled = false,
}: TierSelectProps) {
  const classes = value ? tierClasses(value) : NEUTRAL_CLASSES

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        value={value ?? NO_TIER}
        disabled={disabled || saving}
        onChange={(e) =>
          onChange(e.target.value === NO_TIER ? null : e.target.value)
        }
        aria-label="Tier"
        className={`rounded border px-1.5 py-0.5 text-xs font-medium focus:border-blue-500 focus:outline-none disabled:opacity-50 ${classes}`}
      >
        <option value={NO_TIER}>No tier</option>
        {TIERS.map((tier) => (
          <option key={tier.name} value={tier.name}>
            {tier.name}
          </option>
        ))}
      </select>
      {saving && (
        <span className="text-xs text-gray-500" aria-live="polite">
          saving...
        </span>
      )}
    </span>
  )
}
