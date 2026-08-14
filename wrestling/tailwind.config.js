/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Performance rating colours (1-5) only. Overall match ratings have
        // their own non-gradient scheme defined in
        // src/components/Rating/MatchRatingBadge.tsx.
        rating: {
          1: '#ef4444',  // red     — Negative
          2: '#f97316',  // orange  — Neutral
          3: '#f59e0b',  // amber   — Positive
          4: '#eab308',  // yellow  — Great
          5: '#84cc16',  // lime    — Outstanding
        },
      },
    },
  },
  plugins: [],
}
