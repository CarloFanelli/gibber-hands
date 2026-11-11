/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// GitHub Pages serves the site under /<repo-name>/ — keep in sync with the repository name, as the
// link-preview addresses in index.html.
export default defineConfig({
  base: '/gibber-hands/',
  plugins: [tailwindcss()],
  server: { port: 5173 },
  test: { environment: 'node' }
});
