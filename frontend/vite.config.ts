import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        proxy: {
            '/api': 'http://localhost:5000',
            '/auth': 'http://localhost:5000',
            '/courses': 'http://localhost:5000',
            '/enroll': 'http://localhost:5000',
            '/recommend': 'http://localhost:5000',
            '/rate': 'http://localhost:5000',
            '/events': 'http://localhost:5000',
            '/universities': 'http://localhost:5000',
            '/management': 'http://localhost:5000',
            '/admin': 'http://localhost:5000',
            '/uploads': 'http://localhost:5000'
        },
        watch: {
            usePolling: true,
            interval: 100
        }
    }
})
