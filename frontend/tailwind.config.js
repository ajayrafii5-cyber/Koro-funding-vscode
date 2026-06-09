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
        bg:       '#07090F',
        bg2:      '#0D1117',
        surface:  '#111827',
        surface2: '#1A2235',
        teal:     '#00D4C8',
        gold:     '#F0A500',
        danger:   '#FF4D6D',
        muted:    '#6B7A99',
      },
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        teal: '0 0 20px rgba(0,212,200,0.35)',
        gold: '0 0 20px rgba(240,165,0,0.25)',
      },
      animation: {
        ticker: 'ticker 30s linear infinite',
        pulse2: 'pulse2 2s ease infinite',
      },
      keyframes: {
        ticker: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        pulse2: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
    },
  },
  plugins: [],
};
