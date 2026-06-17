import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/prode/', // <-- ASEGÚRATE DE QUE TENGA LAS DOS BARRAS '/'
})