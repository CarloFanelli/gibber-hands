/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// GitHub Pages serves the site under /<repo-name>/ — keep in sync with the repository name.
export default defineConfig({
  base: '/gibber-hands/',
  server: { port: 5173 },
  test: { environment: 'node' }
});
