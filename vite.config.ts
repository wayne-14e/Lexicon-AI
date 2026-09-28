import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Explicitly load GEMINI_API_KEYs from `.env*` files.
  // This is important because the app relies on Vite-time `define` injection.
  // NOTE: Vite reads env files only at startup — after creating/editing
  // `.env.local` you must fully stop and restart `npm run dev`.
  const env = loadEnv(mode, process.cwd(), '');
  const geminiApiKey = env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? '';
  const geminiApiKey2 = env.GEMINI_API_KEY_2 ?? process.env.GEMINI_API_KEY_2 ?? '';
  const geminiApiKey3 = env.GEMINI_API_KEY_3 ?? process.env.GEMINI_API_KEY_3 ?? '';

  return {
    base: '/',
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/supabase': {
          target: 'https://uthwpmxgwjcsoeabugbi.supabase.co',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/supabase/, '')
        }
      }
    },
    define: {
      // This allows the app to access process.env.GEMINI_API_KEY in the browser
      // (fallback path when /api/gemini is unreachable, e.g. `npm run dev`).
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'process.env.GEMINI_API_KEY_2': JSON.stringify(geminiApiKey2),
      'process.env.GEMINI_API_KEY_3': JSON.stringify(geminiApiKey3)
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 600,
      assetsInlineLimit: 4096,
      // Only the entry + React runtime are needed for first paint.
      // Clerk (~330KB remote + 80KB vendor), Supabase (~190KB), genai
      // (~260KB), charts (~350KB) and markdown (~115KB) all load on demand
      // instead of competing with LCP on the critical path. (Lighthouse
      // flagged ~215KiB unused JS / 450ms from exactly these chunks.)
      modulePreload: {
        polyfill: false,
        resolveDependencies: (filename, deps) =>
          deps.filter(
            (dep) =>
              !dep.includes('vendor-markdown') &&
              !dep.includes('vendor-clerk') &&
              !dep.includes('vendor-supabase') &&
              !dep.includes('vendor-genai') &&
              !dep.includes('vendor-charts'),
          ),
      },
      rollupOptions: {
        output: {
          // Split vendors so the initial chunk stays small and repeat visits
          // hit cached vendor chunks instead of re-downloading one 1MB+ blob.
          // Function form is used because the object form silently inlined
          // react and @google/genai into the entry chunk (empty-chunk warn).
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('node_modules/@clerk/')) return 'vendor-clerk';
            if (id.includes('node_modules/@supabase/')) return 'vendor-supabase';
            if (id.includes('node_modules/@google/genai')) return 'vendor-genai';
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-is/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            // recharts is only imported by the lazy ProfileView.
            if (id.includes('node_modules/recharts/')) return 'vendor-charts';
            // react-markdown family is only imported by lazy LexyAssistant.
            if (
              id.includes('node_modules/react-markdown/') ||
              id.includes('node_modules/remark-') ||
              id.includes('node_modules/rehype-') ||
              id.includes('node_modules/mdast-') ||
              id.includes('node_modules/micromark') ||
              id.includes('node_modules/unist-') ||
              id.includes('node_modules/hast-') ||
              id.includes('node_modules/vfile')
            ) {
              return 'vendor-markdown';
            }
            return undefined;
          },
        },
      },
    },
  };
});
