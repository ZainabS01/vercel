/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', '"Noto Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          black: '#0B0B0F',
          blue: '#2563EB',
          red: '#DC2626',
        },
      },
      boxShadow: {
        card: '0 10px 20px -5px rgba(0,0,0,0.1), 0 6px 12px -6px rgba(0,0,0,0.1)'
      }
    },
  },
  plugins: [],
}