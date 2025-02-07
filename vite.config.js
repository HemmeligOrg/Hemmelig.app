import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

const path = fileURLToPath(import.meta.url);
const root = resolve(dirname(path), 'client');

// Get git info
const getGitInfo = () => {
    const sha = process.env.GIT_SHA || 'main';
    const tag = process.env.GIT_TAG || 'latest';

    return { sha, tag };
};

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
    define: {
        'import.meta.env.VITE_GIT_SHA': JSON.stringify(getGitInfo().sha),
        'import.meta.env.VITE_GIT_TAG': JSON.stringify(getGitInfo().tag),
    },
});
