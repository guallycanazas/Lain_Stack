/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand — telecom deep blue/teal
        brand: {
          50:  '#edfcff',
          100: '#d6f6ff',
          200: '#b5edff',
          300: '#83e1ff',
          400: '#48cbff',
          500: '#1eaeff',
          600: '#068df2',
          700: '#0270df',
          800: '#075ab5',
          900: '#0c4d8e',
          950: '#082f5a',
        },
        // Surface/background
        surface: {
          50:  '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a1929',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
