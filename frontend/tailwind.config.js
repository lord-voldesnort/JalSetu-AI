/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jalsetu: {
          'ivory-rich': '#F5EFE3',
          'ivory-porcelain': '#FFFCF6',
          'tomato-muted': '#B95B55',
          'orange-burnt': '#C96D3B',
          'brown-espresso': '#69483A',
          'champagne-soft': '#E8D6C5',
          'peach-pale': '#F2E1D4',
          'rose-dusty': '#D99A91',
          'taupe-warm': '#817064',
          'cocoa-deep': '#382A25',
          'olive-muted': '#85845A',
          'gold-orchid': '#E5B94B',
          'text-primary': '#2C201C',
          'text-secondary': '#817064',
          'text-muted': '#9D8D82',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace']
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(105, 72, 58, 0.06), 0 1px 2px rgba(105, 72, 58, 0.04)',
        'warm-md': '0 4px 8px -1px rgba(105, 72, 58, 0.08), 0 2px 4px -2px rgba(105, 72, 58, 0.05)',
        'warm-lg': '0 10px 18px -3px rgba(56, 42, 37, 0.1), 0 4px 6px -4px rgba(56, 42, 37, 0.06)',
        'warm-xl': '0 20px 28px -5px rgba(56, 42, 37, 0.12), 0 8px 10px -6px rgba(56, 42, 37, 0.08)',
      }
    },
  },
  plugins: [],
}
