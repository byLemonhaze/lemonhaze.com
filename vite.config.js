import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    // Deep-linked SPA routes are served from nested paths like /supply/,
    // so production assets need root-relative URLs instead of ./assets/...
    base: '/',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },
});
