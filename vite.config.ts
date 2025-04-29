import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Only load env variables prefixed with VITE_
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  
  return {
    plugins: [react()],
    // Expose only Vite-specific env variables to the client
    define: {
      'process.env': Object.keys(env).reduce<Record<string, string>>((prev, key) => {
        prev[key] = env[key]
        return prev
      }, {})
    }
  }
})
