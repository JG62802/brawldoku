import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { obscurityApiPlugin } from './src/server/obscurityApiPlugin';

export default defineConfig({
  plugins: [react(), obscurityApiPlugin()],
});
