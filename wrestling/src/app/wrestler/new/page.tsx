'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import { createWrestler } from '@/lib/api'
import { errorMessage } from '@/lib/format'

interface FormState {
  displayName: string
  aliases: string
  cagematchUrl: string
}

const EMPTY_FORM: FormState = {
  displayName: '',
  aliases: '',
  cagematchUrl: '',
}

const inputClasses =
  'w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

function NewWrestler() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.displayName.trim()) {
      setError('Display name is required')
      return
    }

    // The API derives the lowercase canonical name and alias search keys, so
    // aliases go up as plain display strings.
    const aliases = form.aliases
      .split(',')
      .map((alias) => alias.trim())
      .filter(Boolean)

    setSubmitting(true)
    try {
      const created = await createWrestler(
        {
          displayName: form.displayName.trim(),
          aliases: aliases.length > 0 ? aliases : undefined,
          cagematchUrl: form.cagematchUrl.trim() || undefined,
        },
        getToken,
      )
      router.push(`/wrestler/${created.id}`)
    } catch (err) {
      setError(errorMessage(err, 'Could not create wrestler'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl">
      <Link
        href="/wrestlers"
        className="text-sm text-blue-400 hover:text-blue-300"
      >
        &larr; Back to wrestlers
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Add a wrestler</h1>
      <p className="mb-6 mt-1 text-sm text-gray-400">
        Match counts and career score stay at zero until this wrestler appears
        in matches and the year stats are recomputed.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded border border-gray-800 bg-gray-900/50 p-5"
      >
        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Display name <span className="text-red-400">*</span>
          </label>
          <input
            className={inputClasses}
            value={form.displayName}
            onChange={update('displayName')}
            placeholder="Ric Flair"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Other names / aliases{' '}
            <span className="text-gray-500">(comma-separated)</span>
          </label>
          <input
            className={inputClasses}
            value={form.aliases}
            onChange={update('aliases')}
            placeholder="Nature Boy, Black Scorpion"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Cagematch URL <span className="text-gray-500">(optional)</span>
          </label>
          <input
            className={inputClasses}
            value={form.cagematchUrl}
            onChange={update('cagematchUrl')}
            placeholder="https://www.cagematch.net/?id=2&nr=..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded border border-blue-600 bg-blue-600 px-6 py-2 text-sm font-medium transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create wrestler'}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </div>
  )
}

export default function NewWrestlerPage() {
  return (
    <ProtectedRoute>
      <NewWrestler />
    </ProtectedRoute>
  )
}
