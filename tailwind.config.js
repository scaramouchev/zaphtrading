/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          onyx: '#000000',
          obsidian: '#0A0A0C',
          silver: '#F5F5F7',
          ash: '#86868B',
          blue: '#2997FF',
          mint: '#30D5C8',
          coral: '#FF3B30',
        },
        glass: {
          border: 'rgba(255, 255, 255, 0.08)',
          surface: 'rgba(255, 255, 255, 0.03)',
          hover: 'rgba(255, 255, 255, 0.06)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        xl: '20px',
      },
      borderWidth: {
        DEFAULT: '1px',
      },
      boxShadow: {
        premium: '0 20px 40px rgba(0, 0, 0, 0.6)',
        elevated: '0 8px 24px rgba(0, 0, 0, 0.4)',
        glow: '0 0 15px rgba(41, 151, 255, 0.3)',
        glowMint: '0 0 15px rgba(48, 213, 200, 0.3)',
        glowCoral: '0 0 15px rgba(255, 59, 48, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 400ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'flash-up': 'flashUp 150ms ease-out',
        'flash-down': 'flashDown 150ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        flashUp: {
          '0%': { backgroundColor: 'rgba(48, 213, 200, 0.12)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashDown: {
          '0%': { backgroundColor: 'rgba(255, 59, 48, 0.12)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};
