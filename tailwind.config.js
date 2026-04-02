/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Clarity', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'pixel':       '3px 3px 0px 0px rgba(0,0,0,0.8)',
        'pixel-sm':    '2px 2px 0px 0px rgba(0,0,0,0.8)',
        'pixel-lg':    '4px 4px 0px 0px rgba(0,0,0,0.6)',
        'pixel-inset': 'inset 2px 2px 0px 0px rgba(0,0,0,0.3)',
      },
      colors: {
        retro: {
          bg:          '#0a0e1a',
          panel:       '#111827',
          border:      '#2d3a5c',
          amber:       '#d97706',
          'amber-dark':'#92400e',
          cyan:        '#22d3ee',
          green:       '#22c55e',
          red:         '#ef4444',
          purple:      '#a855f7',
          yellow:      '#eab308',
          'xp-bg':     '#1e293b',
        },
      },
    },
  },
  plugins: [],
};
