/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1E3A5F',
          dark: '#152C47',
          mid: '#4F8CC9',
          soft: '#EEF4FB',
          border: '#C5D9EE',
        },
        surface: '#F7F9FC',
        success: {
          DEFAULT: '#3FAE7A',
          dark: '#2D8A5F',
          soft: '#EAF7F1',
          border: '#B6E3CE',
        },
        accent: {
          orange: '#E9A23B',
          'orange-soft': '#FEF6EC',
          'orange-border': '#F9D9A0',
          gold: '#B8922A',
        },
        ink: {
          900: '#2B2F33',
          700: '#4A5056',
          500: '#6E757D',
          400: '#9BA3AC',
          300: '#C8CDD3',
          200: '#E1E5EA',
          100: '#F0F3F6',
        },
        // Dark mode palette — azul oscuro profundo + naranja como contraste
        night: {
          bg:       '#09131F', // Fondo global
          card:     '#0D1E30', // Cards y superficies
          elevated: '#132538', // Header, modales, inputs
          border:   '#1A3350', // Bordes
          text:     '#E4EFF8', // Texto principal
          muted:    '#6A9AB8', // Texto secundario
          dim:      '#364F63', // Texto muy apagado / placeholders
        },
      },
      boxShadow: {
        soft:   '0 1px 4px rgba(0,0,0,0.06)',
        card:   '0 4px 20px rgba(30,58,95,0.08)',
        lg:     '0 8px 32px rgba(30,58,95,0.12)',
        'dark-card': '0 4px 24px rgba(0,0,0,0.40)',
      },
    },
  },
  plugins: [],
};
