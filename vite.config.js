import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: { // Add Vitest configuration
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'], // Only include tests in src directory
    exclude: ['backend/**'], // Exclude backend directory
    globals: true, // Enable global APIs like describe, it, expect
    environment: 'jsdom', // Simulate a browser environment
    setupFiles: './src/setupTests.js', // Optional: setup file for tests
    css: true, // Enable CSS processing
  },
})
