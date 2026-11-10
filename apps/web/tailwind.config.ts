import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--theme-white) / <alpha-value>)',
        slate: {
          50: 'rgb(var(--theme-slate-50) / <alpha-value>)',
          100: 'rgb(var(--theme-slate-100) / <alpha-value>)',
          200: 'rgb(var(--theme-slate-200) / <alpha-value>)',
          300: 'rgb(var(--theme-slate-300) / <alpha-value>)',
          400: 'rgb(var(--theme-slate-400) / <alpha-value>)',
          500: 'rgb(var(--theme-slate-500) / <alpha-value>)',
          600: 'rgb(var(--theme-slate-600) / <alpha-value>)',
          700: 'rgb(var(--theme-slate-700) / <alpha-value>)',
          800: 'rgb(var(--theme-slate-800) / <alpha-value>)',
          900: 'rgb(var(--theme-slate-900) / <alpha-value>)',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        ink: {
          500: 'rgb(var(--theme-ink-500) / <alpha-value>)',
          600: 'rgb(var(--theme-ink-600) / <alpha-value>)',
          700: 'rgb(var(--theme-ink-700) / <alpha-value>)',
          800: 'rgb(var(--theme-ink-800) / <alpha-value>)',
          900: 'rgb(var(--theme-ink-900) / <alpha-value>)',
          950: 'rgb(var(--theme-ink-950) / <alpha-value>)',
        },
        acento: '#7c5cff',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        brillo: '0 0 90px -25px rgba(16, 185, 129, 0.55)',
        tarjeta: '0 24px 60px -40px rgba(0, 0, 0, 0.9)',
      },
      keyframes: {
        flotar: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulsoSuave: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        aparecer: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        flotar: 'flotar 7s ease-in-out infinite',
        pulsoSuave: 'pulsoSuave 4s ease-in-out infinite',
        aparecer: 'aparecer 300ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
