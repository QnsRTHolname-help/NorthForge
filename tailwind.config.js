/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Clay brand palette (fixed identity)
        clay: {
          canvas: '#F4F1FA',
          ink: '#332F3A',
          sub: '#635F69',
          violet: '#7C3AED',
          pink: '#DB2777',
          sky: '#0EA5E9',
          success: '#10B981',
          warning: '#F59E0B',
        },
        brand: {
          DEFAULT: '#7C3AED',
          50: '#f5f2ff', 100: '#ede6ff', 200: '#dcccff', 300: '#c3a6ff',
          400: '#a677fb', 500: '#7C3AED', 600: '#6d28d9', 700: '#5b21b6',
          800: '#4c1d95', 900: '#3b1478',
        },
        pink2: {
          DEFAULT: '#DB2777',
          50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4',
          400: '#f472b6', 500: '#DB2777', 600: '#be185d', 700: '#9d174d',
        },
        sky2: {
          DEFAULT: '#0EA5E9',
          50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
          400: '#38bdf8', 500: '#0EA5E9', 600: '#0284c7', 700: '#0369a1',
        },
        // Semantic surface tokens driven by CSS vars (theme-aware)
        surface: 'rgb(var(--surface) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        sunken: 'rgb(var(--sunken) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        content: 'rgb(var(--content) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
      },
      borderRadius: {
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        '5xl': '48px',
        '6xl': '60px',
      },
      boxShadow: {
        // Multi-layer clay shadows (light theme). Dark overrides live in CSS vars via .clay classes.
        'clay-sm': 'var(--clay-sm)',
        'clay': 'var(--clay)',
        'clay-lg': 'var(--clay-lg)',
        'clay-xl': 'var(--clay-xl)',
        'clay-pressed': 'var(--clay-pressed)',
        'clay-inset': 'var(--clay-inset)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.94)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'slide-in-right': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        'slide-in-left': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        'toast-in': { '0%': { opacity: '0', transform: 'translateY(16px) scale(0.96)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        'grow-bar': { '0%': { transform: 'scaleX(0)' }, '100%': { transform: 'scaleX(1)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'blob-1': {
          '0%,100%': { transform: 'translate(0,0) scale(1) rotate(0deg)' },
          '33%': { transform: 'translate(3%,-4%) scale(1.08) rotate(12deg)' },
          '66%': { transform: 'translate(-2%,3%) scale(0.96) rotate(-8deg)' },
        },
        'blob-2': {
          '0%,100%': { transform: 'translate(0,0) scale(1) rotate(0deg)' },
          '50%': { transform: 'translate(-4%,4%) scale(1.12) rotate(-14deg)' },
        },
        'blob-3': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '40%': { transform: 'translate(4%,3%) scale(1.1)' },
          '70%': { transform: 'translate(-3%,-2%) scale(0.94)' },
        },
        'clay-float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'clay-breathe': {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .4s ease both',
        'fade-up': 'fade-up .5s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scale-in .22s cubic-bezier(0.34,1.56,0.64,1) both',
        'slide-in-right': 'slide-in-right .32s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in-left': 'slide-in-left .32s cubic-bezier(0.22,1,0.36,1) both',
        'toast-in': 'toast-in .34s cubic-bezier(0.34,1.56,0.64,1) both',
        'grow-bar': 'grow-bar .9s cubic-bezier(0.22,1,0.36,1) both',
        'spin-slow': 'spin-slow 1s linear infinite',
        'blob-1': 'blob-1 11s ease-in-out infinite',
        'blob-2': 'blob-2 9s ease-in-out infinite',
        'blob-3': 'blob-3 12s ease-in-out infinite',
        'clay-float': 'clay-float 6s ease-in-out infinite',
        'clay-breathe': 'clay-breathe 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
