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
        // Performance rating colours (1-5). These are the solid fills used by
        // RatingDistribution's bars and strips. The same hues drive
        // PerformanceBadge, which declares them as literal Tailwind palette
        // classes because Tailwind cannot build class names from interpolated
        // values — keep the two in step.
        //
        // Deliberately the same colour language as the overall match rating
        // scale in src/components/Rating/MatchRatingBadge.tsx, minus that
        // scale's gold band for the quarter-points above 4.
        rating: {
          1: '#ef4444',  // red-500     — Negative
          2: '#3b82f6',  // blue-500    — Neutral
          3: '#f97316',  // orange-500  — Positive
          4: '#22c55e',  // green-500   — Great
          5: '#a855f7',  // purple-500  — Outstanding
        },
      },
    },
  },
  plugins: [],
}
