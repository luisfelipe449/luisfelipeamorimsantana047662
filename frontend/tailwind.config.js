/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0f7',
          100: '#c5d9eb',
          200: '#9fc0de',
          300: '#79a7d1',
          400: '#5c94c7',
          DEFAULT: '#3e72aa',
          500: '#3e72aa',
          600: '#386a9f',
          700: '#305f93',
          800: '#285487',
          900: '#1a4070',
        },
        accent: {
          50: '#e0f7f6',
          100: '#b3ece8',
          200: '#80e0d9',
          300: '#4dd4ca',
          400: '#26cabe',
          DEFAULT: '#00bdb4',
          500: '#00bdb4',
          600: '#00afa6',
          700: '#00a097',
          800: '#009188',
          900: '#007a6c',
        },
        success: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          DEFAULT: '#4caf50',
          500: '#4caf50',
          600: '#43a047',
        },
        warning: {
          50: '#fff3e0',
          100: '#ffe0b2',
          DEFAULT: '#ff9800',
          500: '#ff9800',
          600: '#fb8c00',
        },
        error: {
          50: '#ffebee',
          100: '#ffcdd2',
          DEFAULT: '#f44336',
          500: '#f44336',
          600: '#e53935',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind reset to avoid conflicts with Angular Material
  },
}
