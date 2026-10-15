/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tahara: {
          50: '#fdf4f5',
          100: '#fbe8eb',
          200: '#f7d5d9',
          300: '#f0b3bc',
          400: '#e58797',
          500: '#d75d74',
          600: '#bf3f59',
          700: '#a02e45',
          800: '#86293d',
          900: '#722637',
          950: '#40101b',
        },
        hebrew: {
          gold: '#c59b27',
          parchment: '#faf7f2',
          ink: '#1f2937',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
