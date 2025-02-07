import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

const path = fileURLToPath(import.meta.url);
const root = resolve(dirname(path), 'client');

// Get git info
const getGitInfo = () => {
    try {
        const sha = execSync('git rev-parse --short HEAD').toString().trim();
        const tag = execSync('git describe --tags --abbrev=0').toString().trim();
        return { sha, tag };
    } catch (e) {
        return { sha: 'unknown', tag: 'unknown' };
    }
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
