import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    // allowedHosts: ["*"], // ✅ allow all hosts
    allowedHosts: ["client", "localhost"], // ✅ match Docker + browser, can be specific strict only allow client
    port: 5173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
  },
});
