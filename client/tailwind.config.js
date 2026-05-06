/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        display: ['"DM Serif Display"', 'serif'],
      },
      colors: {
        // remapeo de emerald a verde "real estate" oscuro premium
        emerald: {
          50: '#EAF2ED',
          100: '#D8E7DD',
          200: '#C2D9CB',
          300: '#A0BFAB',
          400: '#5C8B73',
          500: '#256040',
          600: '#1A4731',
          700: '#143725',
          800: '#0F2E20',
          900: '#0A2218',
        },
        brand: {
          DEFAULT: '#1A4731',
          dark: '#0F2E20',
          mid: '#256040',
          soft: '#EAF2ED',
          border: '#C2D9CB',
        },
        surface: '#F7F8F6',
        accent: {
          orange: '#C85A2A',
          'orange-soft': '#FEF0E8',
          'orange-border': '#F5C9AF',
          gold: '#9A7C3F',
          blue: '#1E4D8C',
        },
        ink: {
          900: '#1C221C',
          700: '#374037',
          500: '#6B786B',
          400: '#9BA69B',
          300: '#CDD3CD',
          200: '#E2E6E2',
          100: '#F0F2F0',
        },
      },
      boxShadow: {
        soft: '0 1px 4px rgba(0,0,0,0.07)',
        card: '0 4px 18px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};
