import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const path = fileURLToPath(import.meta.url);
const root = resolve(dirname(path), 'client');

import tailwindcss from 'tailwindcss';

export default defineConfig({
    root,
    build: {
        outDir: 'build',
    },
    publicDir: 'public',
    plugins: [react()],
    css: {
        postcss: {
            plugins: [tailwindcss()],
        },
    },
});
