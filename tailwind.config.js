/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        diff: {
          added: '#22c55e',
          removed: '#ef4444',
          changed: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
