/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jet-black': '#0A0A0B',
        'obsidian': '#111114',
        'graphite': '#1B1D22',
        'cerulean': '#2A9DDB',
        'neon-rose': '#FF3B6B',
        'pure-white': '#F5F7FA',
        'slate-gray': '#8B929E',
        'field-green': '#49B675',
        'amber-alert': '#E8AD45',
        'border-gray': '#292C33',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
