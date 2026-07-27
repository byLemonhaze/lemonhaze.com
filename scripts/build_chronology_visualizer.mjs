import { build } from 'esbuild';

await build({
    entryPoints: ['src/visualizer/chronology-entry.tsx'],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    jsx: 'automatic',
    target: ['es2020'],
    minify: true,
    sourcemap: false,
    outdir: 'public/visualizer/assets',
    entryNames: 'complete-chronology',
    logLevel: 'info',
});
