
// tailwind.config.mjs
import { defineConfig } from 'tailwindcss/helpers'

export default defineConfig({
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
})
