import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'forks',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'lucide-react-native': 'lucide-react',
    },
  },
  define: {
    __DEV__: true,
  },
});
