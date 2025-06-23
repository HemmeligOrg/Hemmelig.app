import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import devServer from '@hono/vite-dev-server';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        devServer({
            entry: 'src/server/app.ts',
            exclude: [
                // Exclude all paths that don't start with /api
                /^(?!\/api).*/,
            ],
        }),
    ],
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
});
