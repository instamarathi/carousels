import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For GitHub Pages, the site is served from /<repo-name>/.
// Override at build time: VITE_BASE=/carousels/ npm run build
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? "/",
  publicDir: "public",
  server: { port: 5173, open: true },
});
