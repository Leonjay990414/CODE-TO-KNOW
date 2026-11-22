import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const isPullRequest = process.env.IS_PULL_REQUEST === 'true';

  return {
    base: process.env.VITE_BASE_PATH || './',
    plugins: [react()],
    define: isPullRequest
      ? {
          'import.meta.env.VITE_DEMO_MODE': JSON.stringify('true'),
          'import.meta.env.VITE_API_URL': JSON.stringify(''),
        }
      : {},
    server: {
      port: 3000,
      open: false,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'theory-data': ['./src/data/officialTheoryQuestionBank.json'],
          },
        },
      },
    },
  };
});
