/** @type {import('tailwindcss').Config} */
import plugin from '@tailwindcss/forms'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    plugin,
    require('tailwind-scrollbar'),
  ],
};
