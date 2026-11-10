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
          // Primary Brand Blues
          'ocean-blue': '#123B66',
          'freshwater': '#299BCB',
          'freshwater-hover': '#2184AD',
          'stale-water': '#647F8C',
          // Agricultural Field Greens
          'deep-crop': '#245C38',
          'crop-green': '#438653',
          'light-crop': '#78AD76',
          'pale-field': '#E8F2E5',
          // Highlight
          'sunshine-orange': '#F29A38',
          'sunshine-hover': '#DE8828',
          // Surfaces and Canvas
          'bg-app': '#F5F8FC',
          'surface': '#FFFFFF',
          'card': '#FFFFFF',
          'muted': '#F0F4F8',
          // Percentage Bars Palette
          'bar-deep': '#123B66',
          'bar-std': '#1976B9',
          'bar-fresh': '#299BCB',
          'bar-light': '#76C4E5',
          'bar-track': '#DCEFF8',
          // Documented Risk Statuses
          'risk-high': '#D32F2F',
          'risk-mod': '#D97706',
          'risk-low': '#438653',
          'risk-paused': '#299BCB',
          // Text and Borders
          'text-primary': '#0F172A',
          'text-secondary': '#334155',
          'text-muted': '#64748B',
          'border-subtle': '#E2E8F0',
          'border-medium': '#CBD5E1',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace']
      },
      boxShadow: {
        'ocean-sm': '0 1px 3px rgba(18, 59, 102, 0.08), 0 1px 2px rgba(18, 59, 102, 0.05)',
        'ocean-md': '0 4px 12px -1px rgba(18, 59, 102, 0.10), 0 2px 4px -2px rgba(18, 59, 102, 0.05)',
        'ocean-lg': '0 12px 24px -3px rgba(18, 59, 102, 0.15), 0 4px 6px -4px rgba(18, 59, 102, 0.08)',
        'ocean-xl': '0 20px 32px -5px rgba(18, 59, 102, 0.18), 0 8px 12px -6px rgba(18, 59, 102, 0.10)',
        'crop-sm': '0 1px 3px rgba(36, 92, 56, 0.08), 0 1px 2px rgba(36, 92, 56, 0.05)',
        'crop-md': '0 4px 12px -1px rgba(36, 92, 56, 0.10), 0 2px 4px -2px rgba(36, 92, 56, 0.05)',
      }
    },
  },
  plugins: [],
}
