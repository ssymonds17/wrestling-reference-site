'use client'

import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '@clerk/nextjs'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import { createPromotion, getPromotions, Promotion } from '@/lib/api'

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

const errorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback
  }
  return err instanceof Error ? err.message : fallback
}

const inputClasses =
  'w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500'

function Promotions() {
  const { getToken } = useAuth()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadPromotions = useCallback(async () => {
    setLoading(true)
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
      setSuccess(`Created "${created.displayName}" (id ${created.id})`)
      setForm(EMPTY_FORM)
      await loadPromotions()
    } catch (err) {
      setError(errorMessage(err, 'Could not create promotion'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold">Promotions</h1>
      <p className="text-gray-400 mt-1 mb-6 text-sm">
        Browse promotions and add new ones.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-gray-900/50 border border-gray-800 rounded p-5 mb-8"
      >
        <div>
          <label className="block text-sm text-gray-300 mb-1">
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
          <label className="block text-sm text-gray-300 mb-1">
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
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
            <label className="block text-sm text-gray-300 mb-1">
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

        <div>
          <label className="block text-sm text-gray-300 mb-1">
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
          <label className="block text-sm text-gray-300 mb-1">
            Notes <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            className={inputClasses}
            rows={2}
            value={form.notes}
            onChange={update('notes')}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 border border-blue-600 rounded text-sm font-medium transition-colors"
        >
          {submitting ? 'Creating...' : 'Create promotion'}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}
      </form>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">
          Stored promotions{' '}
          <span className="text-gray-500 text-base">({promotions.length})</span>
        </h2>
        <button
          onClick={loadPromotions}
          disabled={loading}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-800 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Display name</th>
              <th className="px-3 py-2 font-medium">Abbrev.</th>
              <th className="px-3 py-2 font-medium">name</th>
              <th className="px-3 py-2 font-medium">Aliases</th>
              <th className="px-3 py-2 font-medium">Cagematch</th>
              <th className="px-3 py-2 font-medium">Notes</th>
              <th className="px-3 py-2 font-medium">ID</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promotion) => (
              <tr key={promotion._id} className="border-t border-gray-800">
                <td className="px-3 py-2">{promotion.displayName}</td>
                <td className="px-3 py-2 text-gray-300">
                  {promotion.abbreviation ?? '-'}
                </td>
                <td className="px-3 py-2 text-gray-400">{promotion.name}</td>
                <td className="px-3 py-2 text-gray-400">
                  {promotion.aliases
                    .map((alias) => `${alias.abbreviation} (${alias.fullName})`)
                    .join(', ')}
                </td>
                <td className="px-3 py-2 text-gray-400">
                  {promotion.cagematchUrl ? (
                    <a
                      href={promotion.cagematchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      link
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-3 py-2 text-gray-400">
                  {promotion.notes ?? '-'}
                </td>
                <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                  {promotion._id}
                </td>
              </tr>
            ))}
            {!loading && promotions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No promotions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PromotionsPage() {
  return (
    <ProtectedRoute>
      <Promotions />
    </ProtectedRoute>
  )
}
