import axios from 'axios'

/**
 * Dates are stored as UTC instants derived from a calendar date, so always
 * read them back in UTC — using local getters would shift the date by a day
 * for anyone west of Greenwich.
 */
export const formatDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${d.getUTCFullYear()}`
}

export const formatScore = (value: number, dp = 2): string =>
  Number.isFinite(value) ? value.toFixed(dp) : '—'

export const errorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback
  }
  return err instanceof Error ? err.message : fallback
}
