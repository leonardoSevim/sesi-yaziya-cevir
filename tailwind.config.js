/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          50: 'rgb(255, 255, 255)',
          100: 'rgb(248, 247, 255)',
          200: 'rgb(240, 238, 255)',
          300: 'rgb(232, 229, 255)',
          400: 'rgb(197, 181, 255)',
          500: 'rgb(161, 140, 255)',
          600: 'rgb(132, 101, 255)',
          700: 'rgb(30, 27, 45)',
          800: 'rgb(22, 20, 31)',
          900: 'rgb(13, 11, 20)'
        }
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
