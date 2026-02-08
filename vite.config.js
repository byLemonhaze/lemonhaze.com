import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: './', // Use relative paths for CDN deployment
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                supply: resolve(__dirname, 'supply.html'),
            },
        },
    },
});
