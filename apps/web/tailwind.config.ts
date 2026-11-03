import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
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
          500: '#263248',
          600: '#1a2438',
          700: '#111a2c',
          800: '#0b1220',
          900: '#070c16',
          950: '#05080f',
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
