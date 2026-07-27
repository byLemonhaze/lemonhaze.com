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
    plugins: [
        {
            name: 'visualizer-directory-index',
            apply: 'serve',
            configureServer(server) {
                // Vite's SPA fallback otherwise serves the gallery index for
                // /visualizer/. Route the directory URL to its static entry.
                server.middlewares.use((request, _response, next) => {
                    const [pathname, query = ''] = (request.url || '').split('?');
                    if (pathname === '/visualizer' || pathname === '/visualizer/') {
                        request.url = `/visualizer/index.html${query ? `?${query}` : ''}`;
                    }
                    next();
                });
            },
        },
    ],
});
