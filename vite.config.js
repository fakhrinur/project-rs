import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dengarkan semua interface lokal agar bisa diakses lewat
    // http://localhost:5173 maupun http://127.0.0.1:5173
    host: true,
    port: 5173,
  },
})
