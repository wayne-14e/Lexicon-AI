
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Explicitly load GEMINI_API_KEY from `.env*` files.
  // This is important because the app relies on Vite-time `define` injection.
  const env = loadEnv(mode, process.cwd(), '');
  const geminiApiKey = env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? '';

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
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
    }
  };
});
