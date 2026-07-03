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
        // Performance rating colours (1-5); also used as the base scale for
        // overall match ratings which span 1-5 with quarter-point increments.
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
