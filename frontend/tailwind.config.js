/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0A0D13', light: '#F6F7FA' },
        surface: { DEFAULT: '#12151D', light: '#FFFFFF', raised: '#171B26', 'raised-light': '#F0F1F5' },
        border: { DEFAULT: '#232838', light: '#E2E4EA' },
        brand: { DEFAULT: '#5B8DEF', dim: '#3D5FA8', 50: '#EEF3FE' },
        healthy: { DEFAULT: '#34D399', dim: '#0F3B2C' },
        retry: { DEFAULT: '#F5A524', dim: '#4A340C' },
        danger: { DEFAULT: '#FB4B4B', dim: '#4A1414' },
        muted: { DEFAULT: '#8992A8', light: '#6B7280' },
        text: { DEFAULT: '#E8EAF0', light: '#12151D' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
      },
      keyframes: {
        'pulse-tick': {
          '0%, 100%': { opacity: 0.3, transform: 'scaleY(0.6)' },
          '50%': { opacity: 1, transform: 'scaleY(1)' },
        },
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-tick': 'pulse-tick 1.6s ease-in-out infinite',
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
