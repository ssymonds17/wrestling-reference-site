'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import WrestlerSearch from '@/components/Search/WrestlerSearch'
import {
  createMatch,
  CreateMatchInput,
  getPromotions,
  OVERALL_MATCH_RATING_VALUES,
  Promotion,
  Wrestler,
} from '@/lib/api'
import { errorMessage } from '@/lib/format'
import { PERFORMANCE_RATING_LABELS } from '@/lib/ratings'

interface ParticipantRow {
  /** null until a wrestler is picked from the search box. */
  wrestler: Wrestler | null
  displayName: string
  performanceRating: string
}

interface FormState {
  date: string
  promotionId: string
  promotionDisplayName: string
  show: string
  matchTitle: string
  participantsDisplay: string
  overallMatchRating: string
  cardUrl: string
  extraInfo: string
}

const EMPTY_FORM: FormState = {
  date: '',
  promotionId: '',
  promotionDisplayName: '',
  show: '',
  matchTitle: '',
  participantsDisplay: '',
  overallMatchRating: '',
  cardUrl: '',
  extraInfo: '',
}

const EMPTY_PARTICIPANT: ParticipantRow = {
  wrestler: null,
  displayName: '',
  performanceRating: '',
}

// The selectable era labels are abbreviations: the canonical abbreviation
// plus every alias abbreviation (e.g. AJPW; or WWE -> WWF, WWWF).
const promotionLabelOptions = (promotion: Promotion): string[] => {
  const opts: string[] = []
  if (promotion.abbreviation) opts.push(promotion.abbreviation)
  for (const alias of promotion.aliases) opts.push(alias.abbreviation)
  return Array.from(new Set(opts))
}

const nameOptionsFor = (wrestler: Wrestler): string[] => [
  wrestler.displayName,
  ...wrestler.aliases.map((a) => a.display),
]

const buildPayload = (
  form: FormState,
  participants: ParticipantRow[],
): CreateMatchInput | { error: string } => {
  if (!form.date) return { error: 'Date is required' }
  if (!form.promotionId) return { error: 'Promotion is required' }
  if (!form.promotionDisplayName) return { error: 'Promotion label is required' }
  if (!form.participantsDisplay.trim()) {
    return { error: 'Participants display is required' }
  }
  const rating = Number(form.overallMatchRating)
  if (!form.overallMatchRating || Number.isNaN(rating)) {
    return { error: 'Overall rating is required' }
  }
  const cleaned = participants.filter(
    (p) => p.wrestler && p.displayName.trim(),
  )
  if (cleaned.length < 2) {
    return { error: 'A match needs at least two participants' }
  }
  return {
    date: form.date,
    promotionId: form.promotionId,
    promotionDisplayName: form.promotionDisplayName,
    show: form.show.trim() || 'House Show',
    matchTitle: form.matchTitle.trim() || 'Singles Match',
    participantsDisplay: form.participantsDisplay.trim(),
    cardUrl: form.cardUrl.trim() || undefined,
    extraInfo: form.extraInfo.trim() || undefined,
    overallMatchRating: rating,
    participants: cleaned.map((p) => ({
      wrestlerId: p.wrestler!._id,
      displayName: p.displayName.trim(),
      performanceRating: p.performanceRating
        ? Number(p.performanceRating)
        : null,
    })),
  }
}

const inputClasses =
  'w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

function NewMatch() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [participants, setParticipants] = useState<ParticipantRow[]>([
    { ...EMPTY_PARTICIPANT },
    { ...EMPTY_PARTICIPANT },
  ])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadPromotions = useCallback(async () => {
    try {
      const { data } = await getPromotions()
      setPromotions(data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load promotions'))
    }
  }, [])

  useEffect(() => {
    loadPromotions()
  }, [loadPromotions])

  const update =
    (field: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handlePromotionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const promotionId = e.target.value
    const promotion = promotions.find((p) => p._id === promotionId)
    setForm((prev) => ({
      ...prev,
      promotionId,
      promotionDisplayName: promotion?.abbreviation ?? '',
    }))
  }

  // Picking a wrestler defaults displayName to their canonical name; the
  // variant selector below only appears when they have aliases to choose from.
  const selectWrestler = (index: number) => (wrestler: Wrestler | null) =>
    setParticipants((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              wrestler,
              displayName: wrestler ? wrestler.displayName : '',
            }
          : row,
      ),
    )

  const setParticipantField =
    (index: number, field: 'displayName' | 'performanceRating') =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      setParticipants((prev) =>
        prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
      )
    }

  const addParticipant = () =>
    setParticipants((prev) => [...prev, { ...EMPTY_PARTICIPANT }])

  const removeParticipant = (index: number) =>
    setParticipants((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const payload = buildPayload(form, participants)
    if ('error' in payload) {
      setError(payload.error)
      return
    }

    setSubmitting(true)
    try {
      const created = await createMatch(payload, getToken)
      setSuccess(`Created match at ${created.show}. Opening it now...`)
      router.push(`/match/${created.id}`)
    } catch (err) {
      setError(errorMessage(err, 'Could not create match'))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPromotion = promotions.find((p) => p._id === form.promotionId)
  const labelOptions = selectedPromotion
    ? promotionLabelOptions(selectedPromotion)
    : []

  return (
    <div className="max-w-4xl">
      <Link
        href="/matches"
        className="text-sm text-blue-400 hover:text-blue-300"
      >
        &larr; Back to matches
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Add a match</h1>
      <p className="mb-6 mt-1 text-sm text-gray-400">
        A match references a promotion and at least two participants. Each
        participant is stored under the name they appeared as in this match.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded border border-gray-800 bg-gray-900/50 p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className={inputClasses}
              value={form.date}
              onChange={update('date')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Overall rating <span className="text-red-400">*</span>
            </label>
            <select
              className={inputClasses}
              value={form.overallMatchRating}
              onChange={update('overallMatchRating')}
            >
              <option value="">Select rating...</option>
              {OVERALL_MATCH_RATING_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Promotion <span className="text-red-400">*</span>
            </label>
            <select
              className={inputClasses}
              value={form.promotionId}
              onChange={handlePromotionChange}
            >
              <option value="">Select promotion...</option>
              {promotions.map((promotion) => (
                <option key={promotion._id} value={promotion._id}>
                  {promotion.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Promotion label (era)
            </label>
            <select
              className={inputClasses}
              value={form.promotionDisplayName}
              onChange={update('promotionDisplayName')}
              disabled={!selectedPromotion}
            >
              <option value="">Select label...</option>
              {labelOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Show{' '}
              <span className="text-gray-500">(defaults to House Show)</span>
            </label>
            <input
              className={inputClasses}
              value={form.show}
              onChange={update('show')}
              placeholder="House Show"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Match title / type{' '}
              <span className="text-gray-500">(defaults to Singles Match)</span>
            </label>
            <input
              className={inputClasses}
              value={form.matchTitle}
              onChange={update('matchTitle')}
              placeholder="Singles Match"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Participants display <span className="text-red-400">*</span>
          </label>
          <input
            className={inputClasses}
            value={form.participantsDisplay}
            onChange={update('participantsDisplay')}
            placeholder="Ric Flair (c) vs. Harley Race"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Participants <span className="text-red-400">*</span>
          </label>
          <p className="mb-2 text-xs text-gray-500">
            Search by name or alias, choose the name they appeared under, then
            set their performance rating.
          </p>
          <div className="space-y-2">
            {participants.map((participant, index) => {
              const wrestler = participant.wrestler
              const hasAliases = Boolean(wrestler && wrestler.aliases.length > 0)
              return (
                <div
                  key={index}
                  className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"
                >
                  <WrestlerSearch
                    selected={wrestler}
                    onSelect={selectWrestler(index)}
                    placeholder={`Participant ${index + 1}...`}
                  />
                  {hasAliases && wrestler ? (
                    <select
                      className={inputClasses}
                      value={participant.displayName}
                      onChange={setParticipantField(index, 'displayName')}
                    >
                      {nameOptionsFor(wrestler).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center px-1 text-sm text-gray-500">
                      {wrestler ? wrestler.displayName : 'Shown as...'}
                    </div>
                  )}
                  <select
                    className={inputClasses}
                    value={participant.performanceRating}
                    onChange={setParticipantField(index, 'performanceRating')}
                  >
                    <option value="">No rating</option>
                    {Object.entries(PERFORMANCE_RATING_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {value} - {label}
                        </option>
                      ),
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeParticipant(index)}
                    disabled={participants.length <= 2}
                    className="rounded border border-gray-700 px-3 text-gray-400 hover:text-red-400 disabled:opacity-30"
                    aria-label={`Remove participant ${index + 1}`}
                  >
                    x
                  </button>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={addParticipant}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300"
          >
            + Add participant
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Card URL <span className="text-gray-500">(optional)</span>
            </label>
            <input
              className={inputClasses}
              value={form.cardUrl}
              onChange={update('cardUrl')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Extra info <span className="text-gray-500">(optional)</span>
            </label>
            <input
              className={inputClasses}
              value={form.extraInfo}
              onChange={update('extraInfo')}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded border border-blue-600 bg-blue-600 px-6 py-2 text-sm font-medium transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create match'}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}
      </form>
    </div>
  )
}

export default function NewMatchPage() {
  return (
    <ProtectedRoute>
      <NewMatch />
    </ProtectedRoute>
  )
}
