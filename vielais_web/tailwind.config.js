/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0d14',
        surface: '#111622',
        'surface-container-low': '#161c2b',
        'surface-container': '#1c2436',
        'surface-container-high': '#242e44',
        'surface-container-highest': '#2d3a54',
        primary: '#f2ca50',
        'primary-container': '#3d3200',
        'primary-fixed': '#ffe082',
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          accent: '#00f0ff'
        },
        emerald: {
          400: '#34d399',
          500: '#10b981'
        },
        'on-surface': '#f3f4f6',
        'on-surface-variant': '#9ca3af'
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
        display: ['"Epilogue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
