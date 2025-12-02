/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
          600: '#222222',
          500: '#2a2a2a',
        },
        light: {
          900: '#ffffff',
          800: '#f8fafc',
          700: '#f1f5f9',
          600: '#e2e8f0',
          500: '#cbd5e1',
        },
      },
      screens: {
        'xs': '475px',
      },
      animation: {
        'pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
        'grid-pattern-light': 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)',
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};