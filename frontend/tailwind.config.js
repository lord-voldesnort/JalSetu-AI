/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          surface: '#f0fcf8',
          'surface-dim': '#d0ddd9',
          'surface-container': '#e4f1ed',
          primary: '#005151',
          'primary-container': '#0e6b6b',
          navy: '#0F2A43',
          teal: '#0B8A8F',
          amber: '#E0A21B',
          red: '#D64545',
          green: '#2E9E5B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'serif'],
        mono: ['IBM Plex Mono', 'monospace']
      }
    },
  },
  plugins: [],
}

