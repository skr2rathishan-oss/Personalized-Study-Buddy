import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // Listen on all addresses
        hmr: {
            host: '10.167.43.101', // Explicit IP for mobile HMR
            clientPort: 5173
        },
        watch: {
            usePolling: true,
            interval: 100
        }
    }
})
