import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
        build: {
            outDir: 'build',
        },
        plugins: [react()],
        server: {
            port: 3001,
            proxy: {
                '/api': 'http://0.0.0.0:3000',
            },
        },
    };
});
