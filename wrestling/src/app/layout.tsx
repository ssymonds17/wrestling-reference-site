import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Wrestling Reference',
  description: 'Match records, wrestler profiles, tiers, and career standings',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-950 text-gray-100">
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
