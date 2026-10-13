/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0B0E14', light: '#F5F6FA' },
        surface: {
          DEFAULT: '#111520',
          light: '#FFFFFF',
          raised: '#181D2A',
          'raised-light': '#F0F1F5',
          overlay: '#1E2333',
        },
        border: {
          DEFAULT: '#252B3B',
          light: '#E0E2E9',
          subtle: '#1C2130',
          focus: '#5B8DEF',
        },
        brand: {
          DEFAULT: '#5B8DEF',
          dim: '#3D5FA8',
          muted: '#4A6FBF',
          50: '#EEF3FE',
          glow: 'rgba(91, 141, 239, 0.15)',
        },
        healthy: { DEFAULT: '#34D399', dim: '#0F3B2C', muted: '#2BB882' },
        retry: { DEFAULT: '#F5A524', dim: '#4A340C', muted: '#D89220' },
        danger: { DEFAULT: '#EF4444', dim: '#4A1414', muted: '#DC3535' },
        muted: { DEFAULT: '#7B849B', light: '#6B7280' },
        text: {
          DEFAULT: '#E8EAF0',
          light: '#12151D',
          secondary: '#A0A7BA',
          tertiary: '#6B7489',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(91,141,239,0.08)',
        glow: '0 0 20px rgba(91, 141, 239, 0.1)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.04)',
        dialog: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },
      keyframes: {
        'pulse-tick': {
          '0%, 100%': { opacity: 0.3, transform: 'scaleY(0.6)' },
          '50%': { opacity: 1, transform: 'scaleY(1)' },
        },
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: 0, transform: 'translateX(12px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: 0, transform: 'translateX(-100%)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'toast-in': {
          '0%': { opacity: 0, transform: 'translateX(100%) scale(0.96)' },
          '100%': { opacity: 1, transform: 'translateX(0) scale(1)' },
        },
        'toast-out': {
          '0%': { opacity: 1, transform: 'translateX(0) scale(1)' },
          '100%': { opacity: 0, transform: 'translateX(100%) scale(0.96)' },
        },
        'status-pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(5px)' },
        },
        'glow-breathe': {
          '0%, 100%': { opacity: 0.4, transform: 'scale(0.98)' },
          '50%': { opacity: 0.75, transform: 'scale(1.02)' },
        },
      },
      animation: {
        'pulse-tick': 'pulse-tick 1.6s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out both',
        'fade-in-up': 'fade-in-up 0.3s ease-out both',
        'slide-in-right': 'slide-in-right 0.2s ease-out both',
        'slide-in-left': 'slide-in-left 0.25s ease-out both',
        'scale-in': 'scale-in 0.15s ease-out both',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'toast-in': 'toast-in 0.25s ease-out both',
        'toast-out': 'toast-out 0.2s ease-in both',
        'status-pulse': 'status-pulse 2s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'float-reverse': 'float-reverse 7s ease-in-out infinite',
        'glow-breathe': 'glow-breathe 4s ease-in-out infinite',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
}
