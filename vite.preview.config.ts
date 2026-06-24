import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Preview-only config: inlines all JS/CSS into one index.html so the build can
// be opened directly from disk (file://) without a server. App.tsx is swapped
// to HashRouter for the duration of the preview build.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-preview', emptyOutDir: true, modulePreload: false },
})
