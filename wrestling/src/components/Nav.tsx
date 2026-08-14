"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"

const LINKS = [
  { href: "/matches", label: "Matches" },
  { href: "/wrestlers", label: "Wrestlers" },
  { href: "/years", label: "Years" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/promotions", label: "Promotions" },
]

export default function Nav() {
  const pathname = usePathname()

  // A link is active for its own page and anything beneath it, so /match/123
  // keeps Matches lit and /wrestler/abc keeps Wrestlers lit. Note the
  // singular detail routes, hence the prefix check on both forms.
  const isActive = (href: string): boolean => {
    if (pathname === href) return true
    const singular = href.replace(/s$/, "")
    return (
      pathname.startsWith(`${href}/`) || pathname.startsWith(`${singular}/`)
    )
  }

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur">
      <div className="container mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Wrestling Reference
        </Link>

        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(link.href)
                  ? "text-blue-400"
                  : "text-gray-400 hover:text-gray-100"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm">
          <SignedIn>
            <Link
              href="/match/new"
              className="text-gray-400 hover:text-gray-100"
            >
              Add match
            </Link>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded border border-gray-700 px-3 py-1.5 hover:border-gray-500"
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  )
}
