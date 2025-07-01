import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import devServer from '@hono/vite-dev-server';

// https://vitejs.dev/config/
export default defineConfig({
    ssr: {
        external: ['./prisma/generated/client', '@prisma/client'],
    },
    plugins: [
        react(),
        devServer({
            entry: 'server.ts',
            exclude: [
                // Exclude all paths that don't start with /api
                /^(?!\/api).*/,
            ],
        }),
    ],
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
    resolve: {
        alias: {
            // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
            '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        },
    },
    publicDir: 'public',
});
