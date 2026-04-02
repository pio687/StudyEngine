import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import yaml from '@rollup/plugin-yaml'; // Import the plugin

export default defineConfig({
  plugins: [
    react(),
    yaml(), // Add the plugin here
  ],
  base: './',
});
