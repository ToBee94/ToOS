import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

// `src/style.css` is published as raw, uncompiled source (see package.json
// exports) — it's meant to be @import'ed into the *consumer's own* Tailwind
// v4 build, not precompiled here. A precompiled bundle would bake the
// `@theme` tokens into static values, so the consumer's own Tailwind JIT
// pass would never learn about them and would silently stop generating any
// utility built on them (bg-ink, text-accent, border-line, ...) for its own
// source files. No Tailwind plugin needed in this build — it only bundles JS.
export default defineConfig({
  plugins: [
    react(),
    dts({ rollupTypes: true, insertTypesEntry: true }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react-router-dom"],
    },
    sourcemap: true,
  },
});
