/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          deep:    '#0b1623',
          mid:     '#0f2035',
          surface: '#1a3050',
          card:    '#0d1a2a',
        },
        go:     '#22c55e',
        teal:   '#06b6d4',
        amber:  '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
