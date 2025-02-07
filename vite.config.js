import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

const path = fileURLToPath(import.meta.url);
const root = resolve(dirname(path), 'client');

export default defineConfig({
    root,
    build: {
        outDir: resolve(root, 'build'),
    },
    publicDir: 'public',
    plugins: [react()],
    css: {
        postcss: {
            plugins: [tailwindcss()],
        },
    },
});
