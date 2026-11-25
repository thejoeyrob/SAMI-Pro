import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          id.includes("/leaflet/")
            ? "map"
            : id.includes("/react/") || id.includes("/react-dom/")
              ? "react"
              : undefined,
      },
    },
  },
});
