import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from the root of youreconomicsyear.com (GitHub Pages custom domain; public/CNAME).
  base: "/",
  plugins: [react()],
  test: { environment: "node", include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"] },
});
