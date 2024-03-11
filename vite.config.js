import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const path = fileURLToPath(import.meta.url);
const root = resolve(dirname(path), 'client');

export default defineConfig(() => {
    return {
        root,
        build: {
            outDir: 'build',
        },
        publicDir: 'public',
        plugins: [react({ jsxRuntime: 'classic' })],
    };
});
