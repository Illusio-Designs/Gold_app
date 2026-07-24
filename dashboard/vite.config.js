import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Strip console.* and debugger from production builds (keeps them in dev).
  esbuild: mode === "production" ? { drop: ["console", "debugger"] } : {},
  server: {
    port: parseInt(process.env.PORT) || 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
}));
