import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // The site is served from https://ardliath.github.io/40kAssistant/
  // so all asset URLs must be prefixed with the repo name.
  base: '/40kAssistant/',
})
