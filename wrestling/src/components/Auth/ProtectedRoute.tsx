'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} height={60} baseColor="#1f2937" highlightColor="#374151" />
        ))}
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-400 mb-6">
            You need to be signed in to view this page.
          </p>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded text-sm font-medium transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
