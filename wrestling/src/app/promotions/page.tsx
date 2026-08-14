'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SignedIn, useAuth } from '@clerk/nextjs'
import { createPromotion, getPromotions, Promotion } from '@/lib/api'
import { errorMessage } from '@/lib/format'

interface FormState {
  displayName: string
  abbreviation: string
  aliasAbbreviations: string
  aliasFullNames: string
  cagematchUrl: string
  notes: string
}

const EMPTY_FORM: FormState = {
  displayName: '',
  abbreviation: '',
  aliasAbbreviations: '',
  aliasFullNames: '',
  cagematchUrl: '',
  notes: '',
}

const splitList = (raw: string): string[] =>
  raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const inputClasses =
  'w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

// Matches the promotion against every searchable form the API indexes:
// canonical name, display name, abbreviation, and both halves of each alias.
const matchesQuery = (promotion: Promotion, query: string): boolean => {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    promotion.name.includes(q) ||
    promotion.displayName.toLowerCase().includes(q) ||
    (promotion.abbreviation ?? '').toLowerCase().includes(q) ||
    promotion.aliases.some(
      (alias) =>
        alias.abbreviation.toLowerCase().includes(q) ||
        alias.fullName.toLowerCase().includes(q),
    )
  )
}

function CreatePromotionForm({ onCreated }: { onCreated: () => void }) {
  const { getToken } = useAuth()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const update =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.displayName.trim()) {
      setError('Display name is required')
      return
    }

    // The two alias columns are paired by position, so a length mismatch
    // would silently pair the wrong abbreviation with the wrong full name.
    const abbreviations = splitList(form.aliasAbbreviations)
    const fullNames = splitList(form.aliasFullNames)
    if (abbreviations.length !== fullNames.length) {
      setError(
        `Alias lists must line up 1:1 — got ${abbreviations.length} abbreviation(s) and ${fullNames.length} full name(s)`,
      )
      return
    }
    const aliases = abbreviations.map((abbreviation, i) => ({
      abbreviation,
      fullName: fullNames[i],
    }))

    setSubmitting(true)
    try {
      const created = await createPromotion(
        {
          displayName: form.displayName.trim(),
          abbreviation: form.abbreviation.trim() || undefined,
          aliases,
          cagematchUrl: form.cagematchUrl.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
        getToken,
      )
      setSuccess(`Added ${created.displayName}`)
      setForm(EMPTY_FORM)
      onCreated()
    } catch (err) {
      setError(errorMessage(err, 'Could not create promotion'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
      >
        Add promotion
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 w-full space-y-4 rounded border border-gray-800 bg-gray-900/50 p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Add a promotion</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-gray-400 hover:text-gray-100"
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Display name <span className="text-red-400">*</span>
          </label>
          <input
            className={inputClasses}
            value={form.displayName}
            onChange={update('displayName')}
            placeholder="World Wrestling Entertainment"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Abbreviation{' '}
            <span className="text-gray-500">(canonical short code)</span>
          </label>
          <input
            className={inputClasses}
            value={form.abbreviation}
            onChange={update('abbreviation')}
            placeholder="WWE"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Alias abbreviations{' '}
            <span className="text-gray-500">(comma-separated)</span>
          </label>
          <input
            className={inputClasses}
            value={form.aliasAbbreviations}
            onChange={update('aliasAbbreviations')}
            placeholder="WWF, WWWF"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Alias full names{' '}
            <span className="text-gray-500">(comma-separated)</span>
          </label>
          <input
            className={inputClasses}
            value={form.aliasFullNames}
            onChange={update('aliasFullNames')}
            placeholder="World Wrestling Federation, World Wide Wrestling Federation"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        The two alias lists are paired by position, so they must have the same
        number of entries.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Cagematch URL <span className="text-gray-500">(optional)</span>
          </label>
          <input
            className={inputClasses}
            value={form.cagematchUrl}
            onChange={update('cagematchUrl')}
            placeholder="https://www.cagematch.net/?id=8&nr=..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Notes <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            className={inputClasses}
            rows={2}
            value={form.notes}
            onChange={update('notes')}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded border border-blue-600 bg-blue-600 px-6 py-2 text-sm font-medium transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create promotion'}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}
    </form>
  )
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPromotions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getPromotions()
      setPromotions(data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load promotions'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPromotions()
  }, [loadPromotions])

  const visible = useMemo(
    () =>
      promotions.filter((promotion) => matchesQuery(promotion, query.trim())),
    [promotions, query],
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Promotions</h1>
          <p className="mt-1 text-sm text-gray-400">
            One entry per legal entity. Historical names are held as aliases, so
            WWF and WWE resolve to the same promotion.
          </p>
        </div>
        <SignedIn>
          <CreatePromotionForm onCreated={loadPromotions} />
        </SignedIn>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name, abbreviation or alias..."
          className="w-full max-w-sm rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <span className="whitespace-nowrap text-sm text-gray-500">
          {loading ? 'Loading...' : `${visible.length} of ${promotions.length}`}
        </span>
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-left text-gray-400">
            <tr>
              <th className="px-3 py-2 font-medium">Abbrev.</th>
              <th className="px-3 py-2 font-medium">Promotion</th>
              <th className="px-3 py-2 font-medium">Also known as</th>
              <th className="px-3 py-2 font-medium">Notes</th>
              <th className="px-3 py-2 text-right font-medium">Matches</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((promotion) => (
              <tr
                key={promotion._id}
                className="border-t border-gray-800 hover:bg-gray-900/40"
              >
                <td className="px-3 py-2 font-medium text-gray-200">
                  {promotion.abbreviation ?? '—'}
                </td>
                <td className="px-3 py-2">
                  {promotion.cagematchUrl ? (
                    <a
                      href={promotion.cagematchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {promotion.displayName}
                    </a>
                  ) : (
                    <span className="text-gray-200">
                      {promotion.displayName}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {promotion.aliases.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {promotion.aliases.map((alias) => (
                        <span
                          key={`${alias.abbreviation}-${alias.fullName}`}
                          title={alias.fullName}
                          className="rounded border border-gray-700 px-1.5 py-0.5 text-xs text-gray-300"
                        >
                          {alias.abbreviation}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="max-w-sm px-3 py-2 text-xs text-gray-500">
                  {promotion.notes ?? ''}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <Link
                    href={`/matches?promotionId=${promotion._id}`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Browse &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  Loading promotions...
                </td>
              </tr>
            )}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  {query
                    ? 'No promotions match that filter.'
                    : 'No promotions yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
